// check-dist-features.mjs — 确认 §66 特征在 dist CSS 里的实际形态
import { readFileSync } from 'node:fs';
const css = readFileSync('dist/_astro/Base.BH7S552V.css', 'utf8');
const t = (n, re) => console.log(n + '=' + re.test(css));
t('pad32', /--pad-align:\s*32px/);
t('pad24', /--pad-align:\s*24px/);
t('pad20', /--pad-align:\s*20px/);
t('has100rem', /100rem/);
t('shellMaxWmax', /--shell-max:\s*var\(--w-max\)/);
