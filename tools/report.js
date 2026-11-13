const fs = require('fs');
const path = require('path');
const dataDir = 'js/data';
const levels = [1,2,3,4,5,6];
let totalWords = 0, totalVerified = 0, totalFlagged = 0;
const flaggedList = [];

for (const lvl of levels) {
  const code = fs.readFileSync(path.join(dataDir, 'level' + lvl + '.js'), 'utf8');
  const match = code.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!match) { console.log('Level ' + lvl + ': PARSE ERROR'); continue; }
  const arr = eval(match[0]);
  let v = 0, f = 0;
  for (const w of arr) {
    if (w.verify) {
      f++;
      flaggedList.push({
        id: w.id,
        level: lvl,
        hanzi: w.hanzi,
        jyutping: w.jyutping,
        english: (w.english || '').substring(0, 80),
        notes: (w.notes || '').substring(0, 100)
      });
    } else {
      v++;
    }
  }
  totalWords += arr.length;
  totalVerified += v;
  totalFlagged += f;
  console.log('Level ' + lvl + ': ' + arr.length + ' words (' + v + ' verified, ' + f + ' flagged)');
}
console.log('');
console.log('TOTAL: ' + totalWords + ' words | ' + totalVerified + ' verified (' + (totalVerified/totalWords*100).toFixed(1) + '%) | ' + totalFlagged + ' flagged (' + (totalFlagged/totalWords*100).toFixed(1) + '%)');
console.log('');
console.log('--- ALL FLAGGED ENTRIES ---');
for (const e of flaggedList) {
  console.log(e.id + ' | L' + e.level + ' | ' + e.hanzi + ' (' + e.jyutping + ') | ' + e.english + ' | Notes: ' + e.notes);
}
