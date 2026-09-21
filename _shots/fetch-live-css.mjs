// fetch-live-css.mjs — 拉线上 /gallery/ HTML 与其 CSS chunk，取证 §66 特征实际形态
const base = 'https://cloudwing.pages.dev';
const bust = '?cb=' + Date.now().toString(36);
const html = await (await fetch(base + '/gallery/' + bust, { cache: 'no-store' })).text();
console.log('HTML bytes=' + html.length);
console.log('html has pad-align=' + html.includes('pad-align'));
console.log('html has shell-max=' + html.includes('shell-max'));
const links = [...new Set([...html.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map(m => m[1]))];
console.log('css links=' + JSON.stringify(links));
let all = '';
for (const l of links) {
  const css = await (await fetch(base + l + bust, { cache: 'no-store' })).text();
  console.log('  ' + l + ' bytes=' + css.length + ' pad-align=' + css.includes('pad-align') + ' shell-max=' + css.includes('shell-max') + ' 100rem=' + css.includes('100rem'));
  all += css;
}
const i = all.indexOf('pad-align');
console.log('pad-align context: ' + (i >= 0 ? all.slice(Math.max(0, i - 40), i + 80) : '(not found)'));
const j = all.indexOf('shell-max');
console.log('shell-max context: ' + (j >= 0 ? all.slice(Math.max(0, j - 40), j + 80) : '(not found)'));
