// Quick smoke test via HTTP fetch + basic DOM parse checks
const http = require('http');

function fetch(urlPath) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:3000' + urlPath, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  const results = [];
  const pass = (t) => { results.push('[PASS] ' + t); console.log('[PASS] ' + t); };
  const fail = (t) => { results.push('[FAIL] ' + t); console.log('[FAIL] ' + t); };
  const check = (cond, label) => cond ? pass(label) : fail(label);

  // 1. index.html loads
  const idx = await fetch('/');
  check(idx.status === 200, 'index.html returns 200');
  check(idx.body.includes('<!DOCTYPE html'), 'index.html has DOCTYPE');
  check(idx.body.includes('Learn Cantonese'), 'Hero title present');

  // 2. CSS loads
  const css = await fetch('/css/style.css');
  check(css.status === 200, 'style.css returns 200');
  check(css.body.includes('--bg-primary'), 'CSS has theme variables');
  check(css.body.includes('backdrop-filter'), 'CSS has glassy nav blur');
  check(css.body.includes('.duo-'), 'CSS has Duolingo-style classes');

  // 3. JS files load
  const mainJs = await fetch('/js/main.js');
  check(mainJs.status === 200, 'main.js returns 200');
  check(mainJs.body.includes('DuoRunner') || mainJs.body.includes('duoRunner') || mainJs.body.includes('startLesson'), 'main.js has Duolingo runner');
  check(mainJs.body.includes('Leitner') || mainJs.body.includes('leitner') || mainJs.body.includes('srs'), 'main.js has SRS/Leitner system');
  check(mainJs.body.includes('speechSynthesis'), 'main.js has speech API');

  const dataJs = await fetch('/js/data.js');
  check(dataJs.status === 200, 'data.js returns 200');

  // 4. Level data files
  for (let i = 1; i <= 6; i++) {
    const lv = await fetch('/js/data/level' + i + '.js');
    check(lv.status === 200, 'level' + i + '.js returns 200');
    check(lv.body.includes('LEVEL' + i + '_DATA') || lv.body.includes('level' + i), 'level' + i + '.js has data array');
  }

  const manual = await fetch('/js/data/manual-slang.js');
  check(manual.status === 200, 'manual-slang.js returns 200');

  // 5. HanziWriter library
  const hw = await fetch('/js/lib/hanzi-writer.min.js');
  check(hw.status === 200, 'hanzi-writer.min.js returns 200');

  const sc = await fetch('/js/lib/stroke-cache.js');
  check(sc.status === 200, 'stroke-cache.js returns 200');

  // 6. HTML structure checks
  check(idx.body.includes('id="learn"') || idx.body.includes("id='learn'"), 'Learn section exists in HTML');
  check(idx.body.includes('id="vocab-library"') || idx.body.includes('vocab-library'), 'Vocab Library section exists');
  check(idx.body.includes('duo-') || idx.body.includes('skill-tree') || idx.body.includes('skill-path'), 'Skill tree markup exists');
  check(idx.body.includes('dark') || idx.body.includes('theme-toggle'), 'Theme toggle markup exists');
  check(idx.body.includes('id="slang"') || idx.body.includes("id='slang'"), 'Slang section exists');
  check(idx.body.includes('id="practice"') || idx.body.includes("id='practice'"), 'Practice section exists');
  check(idx.body.includes('prefers-reduced-motion') || css.body.includes('prefers-reduced-motion'), 'Reduced motion support exists');
  check(idx.body.includes('18+') || idx.body.includes('blur') || idx.body.includes('nsfw') || idx.body.includes('vulgar'), '18+ / blur-to-reveal markup exists');
  check(idx.body.includes('credits') || idx.body.includes('license') || idx.body.includes('Credits'), 'Credits/License section exists');

  // Summary
  console.log('\n=== SMOKE TEST SUMMARY ===');
  const passes = results.filter(r => r.startsWith('[PASS]')).length;
  const fails = results.filter(r => r.startsWith('[FAIL]')).length;
  console.log('Passed: ' + passes + ' / ' + (passes + fails));
  if (fails > 0) {
    console.log('FAILURES:');
    results.filter(r => r.startsWith('[FAIL]')).forEach(r => console.log('  ' + r));
  } else {
    console.log('ALL CHECKS PASSED');
  }
}

main().catch(e => { console.error('Test error:', e.message); process.exit(1); });
