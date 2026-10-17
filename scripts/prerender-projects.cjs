// Preserve the authored project renderer as the source of truth, but publish
// complete HTML so a slow or blocked script cannot leave a project blank.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/project.js'), 'utf8');
const boundary = source.indexOf('const project=projects[');
if (boundary < 0) throw new Error('Project catalog boundary changed; review the renderer.');
const catalogContext = {};
vm.runInNewContext(source.slice(0, boundary) + 'globalThis.catalog=projects;})();', catalogContext);

for (const filename of fs.readdirSync(path.join(root, 'projects'))) {
  if (!filename.endsWith('.html')) continue;
  const file = path.join(root, 'projects', filename);
  let html = fs.readFileSync(file, 'utf8');
  const key = html.match(/data-project="([^"]+)"/)?.[1];
  if (!key) continue;
  let content;
  const complete = new Error('Render captured');
  const main = { set innerHTML(value) { content = value; throw complete; } };
  const document = {
    body: { dataset: { project: key } },
    title: '',
    querySelector(selector) {
      if (selector === '#content') return main;
      throw new Error(`Unexpected selector before rendering: ${selector}`);
    },
  };
  try { vm.runInNewContext(source, { document }); }
  catch (error) { if (error !== complete) throw error; }
  if (!content?.includes('<h1')) throw new Error(`Missing complete project: ${key}`);
  // This subtitle is already removed by the original runtime renderer.
  if (key === 'museum') content = content.replace('<p>Пространство погружения</p>', '');
  html = html.replace(/<main\b[^>]*id="content"[^>]*>[\s\S]*?<\/main>/, `<main id="content" data-prerendered="true">${content}</main>`);
  html = html.replace(/<script\b[^>]*src="\.\.\/js\/(?:project|museum)\.js[^"\s]*"[^>]*><\/script>/g, '');
  html = html.replace(/<script type="application\/json" data-museum-zones>[\s\S]*?<\/script>/g, '');
  if (key === 'museum') {
    const zones = JSON.stringify(catalogContext.catalog.museum.zones).replace(/</g, '\\u003c');
    html = html.replace('</main>', `</main><script type="application/json" data-museum-zones>${zones}</script><script src="../js/museum.js?v=1" defer></script>`);
  }
  fs.writeFileSync(file, html);
  console.log(`${filename}: complete HTML, ${Buffer.byteLength(content)} bytes`);
}
