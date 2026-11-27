'use strict';

const zlib = require('zlib');

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Builds a standard ZIP archive buffer (used for .vsix VS Code extensions).
 * @param {Array<{ name: string, content: Buffer | string }>} entries
 * @returns {Buffer}
 */
function buildZipBuffer(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name.replace(/^\/+/, ''), 'utf8');
    const rawBuf = Buffer.isBuffer(entry.content)
      ? entry.content
      : Buffer.from(String(entry.content), 'utf8');
    const compressed = zlib.deflateRawSync(rawBuf);
    const sum = crc32(rawBuf);

    // Local file header (30 bytes + name)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(8, 8); // deflate
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0x5421, 12); // mod date
    localHeader.writeUInt32LE(sum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(rawBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    // Central directory header (46 bytes + name)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0x0800, 8); // UTF-8
    centralHeader.writeUInt16LE(8, 10); // deflate
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5421, 14);
    centralHeader.writeUInt32LE(sum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(rawBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDirBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirBuf, eocd]);
}

function writeOctal(buf, offset, length, value) {
  const str = value.toString(8).padStart(length - 1, '0') + '\0';
  buf.write(str, offset, length, 'ascii');
}

/**
 * Builds a USTAR .tar.gz archive buffer (npm-installable tarball).
 * @param {Array<{ name: string, content: Buffer | string, mode?: number }>} entries
 * @returns {Buffer}
 */
function buildTgzBuffer(entries) {
  const chunks = [];
  const nowSec = Math.floor(Date.now() / 1000);

  for (const entry of entries) {
    const cleanName = entry.name.replace(/^\/+/, '');
    const data = Buffer.isBuffer(entry.content)
      ? entry.content
      : Buffer.from(String(entry.content), 'utf8');
    const mode = entry.mode || 0o644;

    const header = Buffer.alloc(512, 0);
    header.write(cleanName.slice(0, 100), 0, 'utf8');
    writeOctal(header, 100, 8, mode);
    writeOctal(header, 108, 8, 0);
    writeOctal(header, 116, 8, 0);
    writeOctal(header, 124, 12, data.length);
    writeOctal(header, 136, 12, nowSec);
    header.fill(' ', 148, 156); // checksum placeholder
    header.write('0', 156, 'ascii'); // regular file
    header.write('ustar\0', 257, 'ascii');
    header.write('00', 263, 'ascii');

    let chksum = 0;
    for (let i = 0; i < 512; i += 1) chksum += header[i];
    const chkStr = chksum.toString(8).padStart(6, '0') + '\0 ';
    header.write(chkStr, 148, 8, 'ascii');

    chunks.push(header);
    if (data.length > 0) {
      chunks.push(data);
      const rem = data.length % 512;
      if (rem !== 0) {
        chunks.push(Buffer.alloc(512 - rem, 0));
      }
    }
  }

  // Two 512-byte zero blocks terminate tar archive
  chunks.push(Buffer.alloc(1024, 0));
  return zlib.gzipSync(Buffer.concat(chunks));
}

module.exports = { buildZipBuffer, buildTgzBuffer };
