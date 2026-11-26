const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'slides.html');
const jsPath = path.join(__dirname, 'fragments.js');

if (!fs.existsSync(htmlPath)) {
  console.error('slides.html not found. Run `npm run html` first.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

if (html.includes('fragments.js')) {
  console.log('fragments.js already injected');
  process.exit(0);
}

const fragmentCounter = '<div class="fragment-counter" aria-live="polite"></div>';
const scriptTag = `<script>\n${js}\n</script>`;

if (!html.includes(fragmentCounter)) {
  html = html.replace('</body>', `${fragmentCounter}\n</body>`);
}

if (!html.includes('fragments.js')) {
  html = html.replace('</body>', `${scriptTag}\n</body>`);
}

fs.writeFileSync(htmlPath, html);
console.log('Injected fragments.js and fragment-counter into slides.html');