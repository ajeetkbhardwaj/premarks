#!/usr/bin/env node

'use strict';

const readline = require('readline');

const SERVER_URL = String(process.env.PREMARKS_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const API_KEY = String(process.env.PREMARKS_API_KEY || '').trim();

function writeResponse(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

async function forwardJsonRpc(rawLine) {
  let msg;
  try {
    msg = JSON.parse(rawLine);
  } catch {
    return;
  }

  // Notifications without an id do not expect a JSON-RPC reply if rejected
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (API_KEY) {
    headers.Authorization = `Bearer ${API_KEY}`;
  }

  try {
    const res = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(msg),
    });

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (!res.ok) {
      if (msg && msg.id !== undefined) {
        let parsedErr = null;
        try {
          parsedErr = JSON.parse(text);
        } catch {
          parsedErr = null;
        }
        writeResponse(
          parsedErr && parsedErr.jsonrpc
            ? parsedErr
            : {
                jsonrpc: '2.0',
                id: msg.id,
                error: {
                  code: res.status === 401 ? -32001 : -32000,
                  message:
                    (parsedErr && parsedErr.error && parsedErr.error.message) ||
                    `Premarks MCP HTTP ${res.status}: Set PREMARKS_API_KEY and PREMARKS_URL.`,
                },
              },
        );
      }
      return;
    }

    if (!text.trim()) return;

    if (contentType.includes('text/event-stream')) {
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const payload = line.slice(5).trim();
          if (payload) process.stdout.write(`${payload}\n`);
        }
      }
    } else {
      process.stdout.write(`${text.trim()}\n`);
    }
  } catch (err) {
    if (msg && msg.id !== undefined) {
      writeResponse({
        jsonrpc: '2.0',
        id: msg.id,
        error: {
          code: -32603,
          message: `Premarks MCP bridge error: ${err.message}`,
        },
      });
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  forwardJsonRpc(trimmed);
});
