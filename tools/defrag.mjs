import fs from 'fs';

const files = [
  'src/pages/invito/index.astro',
  'src/pages/scuole.astro',
  'src/pages/famiglie.astro',
  'src/pages/borgo-cunziria.astro',
  'src/pages/insegnante/materiali/index.astro',
  'src/pages/insegnante/impostazioni/index.astro',
  'src/pages/insegnante/dashboard/index.astro',
  'src/pages/insegnante/classe/index.astro',
  'src/pages/avventura/passaporto/index.astro',
  'src/pages/avventura/missione/la-lupa/index.astro',
  'src/pages/avventura/index.astro',
];

for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const m = src.match(/const body = ("(?:\\.|[^"\\])*");\r?\n/);
  if (!m) { console.log('NO BODY:', f); continue; }
  const html = JSON.parse(m[1]).replace(/\r\n/g, '\n');
  if (/[{}]/.test(html)) { console.log('BRACES in', f, '-- skipped'); continue; }
  src = src.replace(m[0], '');
  const indented = html.split('\n').map(l => l ? '  ' + l : l).join('\n');
  src = src.replace(/  <Fragment set:html=\{body\} \/>\n?/, indented + '\n');
  fs.writeFileSync(f, src);
  console.log('OK:', f);
}
