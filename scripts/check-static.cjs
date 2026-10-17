const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
let count = 0;
for (const filename of fs.readdirSync(path.join(root, 'projects'))) {
  if (!filename.endsWith('.html')) continue;
  const file = path.join(root, 'projects', filename);
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('data-project=')) continue;
  assert.match(html, /data-prerendered="true"><(?:section|article)/, filename);
  assert.match(html, /<h1\b/, filename);
  assert.ok(!/src="[^"\s]*\/project\.js/.test(html), `Runtime renderer still required: ${filename}`);
  for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|tel:|#|data:)/.test(value)) continue;
    const local = decodeURIComponent(value.split(/[?#]/)[0]);
    const target = path.resolve(path.dirname(file), local);
    assert.ok(target.startsWith(root + path.sep), `Outside site: ${value}`);
    assert.ok(fs.existsSync(target), `Missing ${value} in ${filename}`);
  }
  count++;
}
assert.equal(count, 9);
console.log(`PASS: ${count} complete project pages, no runtime renderer dependency, all local references exist`);
