/**
 * fix-defs.js — Find and fix all "NO DEF" or empty-definition entries
 * Uses CC-Canto and CC-CEDICT from /tools/raw as lookup sources.
 * Entries that can't be resolved from any dictionary are removed from the dataset.
 */
const fs = require('fs');
const path = require('path');

// --- 1. Load dictionary lookup maps ---
console.log('Loading CC-Canto...');
const cccantoMap = new Map();
const cccantoRaw = fs.readFileSync(path.join(__dirname, 'raw', 'cccanto.txt'), 'utf8');
for (const line of cccantoRaw.split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  // Format: TRAD SIMP [PINYIN] {JYUTPING} /eng1/eng2/
  const m = line.match(/^(\S+)\s+\S+\s+\[[^\]]*\]\s+\{[^}]*\}\s+\/(.+)\/\s*$/);
  if (m) {
    const trad = m[1];
    const eng = m[2].replace(/\//g, '; ').replace(/\s+/g, ' ').trim();
    if (!cccantoMap.has(trad) || eng.length < cccantoMap.get(trad).length) {
      cccantoMap.set(trad, eng);
    }
  }
}
console.log('  CC-Canto entries: ' + cccantoMap.size);

console.log('Loading CC-CEDICT...');
const cedictMap = new Map();
const cedictRaw = fs.readFileSync(path.join(__dirname, 'raw', 'cedict.txt'), 'utf8');
for (const line of cedictRaw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  // Format: TRAD SIMP [PINYIN] /eng1/eng2/
  const m = trimmed.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
  if (m) {
    const trad = m[1];
    const eng = m[4].replace(/\//g, '; ').replace(/\s+/g, ' ').trim();
    if (!cedictMap.has(trad) || eng.length < cedictMap.get(trad).length) {
      cedictMap.set(trad, eng);
    }
  }
}
console.log('  CC-CEDICT entries: ' + cedictMap.size);

// --- 2. Helper to shorten gloss to max ~6 words / 3 meanings ---
function shortenGloss(eng) {
  if (!eng) return '';
  // Split by semicolons, take first 3 meanings
  let parts = eng.split(/;\s*/).filter(Boolean);
  // Remove classifier descriptions, metadata in parens if too long
  parts = parts.map(p => p.replace(/\(CL:.*?\)/g, '').trim()).filter(Boolean);
  parts = parts.slice(0, 3);
  // If any individual part is too long, shorten it
  parts = parts.map(p => {
    const words = p.split(/\s+/);
    if (words.length > 8) return words.slice(0, 6).join(' ') + '…';
    return p;
  });
  return parts.join('; ');
}

// --- 3. Lookup function: try compound, then individual characters ---
function lookupDefinition(hanzi) {
  // Try full compound first
  let def = cccantoMap.get(hanzi) || cedictMap.get(hanzi);
  if (def) return shortenGloss(def);
  
  // For multi-char phrases, try to compose from individual characters
  if (hanzi.length >= 2 && hanzi.length <= 4) {
    const charDefs = [];
    for (const ch of hanzi) {
      const cd = cccantoMap.get(ch) || cedictMap.get(ch);
      if (cd) {
        // Take just the first meaning of each character
        const first = cd.split(/[;\/]/)[0].trim();
        if (first.length > 0 && first.length < 30) charDefs.push(first);
      }
    }
    if (charDefs.length === hanzi.length) {
      return shortenGloss(charDefs.join(' + '));
    }
  }
  
  return '';
}

// --- 4. Process each level file ---
const dataDir = path.join(__dirname, '..', 'js', 'data');
const report = { fixed: {}, removed: {}, unfixable: [] };
let totalFixed = 0, totalRemoved = 0;

for (let lvl = 1; lvl <= 6; lvl++) {
  const filePath = path.join(dataDir, 'level' + lvl + '.js');
  const code = fs.readFileSync(filePath, 'utf8');
  
  // Extract the variable assignment pattern
  const varMatch = code.match(/^([\s\S]*?)(window\.\w+\s*=\s*)\[/m);
  if (!varMatch) { console.log('Level ' + lvl + ': PARSE ERROR - skipping'); continue; }
  
  const preamble = varMatch[1] + varMatch[2];
  const arrMatch = code.match(/\[\s*\{[\s\S]*\}\s*\]/);
  const arr = eval(arrMatch[0]);
  const suffix = code.slice(code.lastIndexOf('];'));
  
  let fixedCount = 0, removedCount = 0;
  const newArr = [];
  
  for (const entry of arr) {
    const isBad = !entry.english || entry.english.trim() === '' || entry.english.includes('NO DEF');
    
    if (!isBad) {
      newArr.push(entry);
      continue;
    }
    
    // Try to fix from dictionaries
    const def = lookupDefinition(entry.hanzi);
    
    if (def) {
      entry.english = def;
      newArr.push(entry);
      fixedCount++;
    } else {
      // Can't fix — remove this entry
      removedCount++;
      report.unfixable.push({ id: entry.id, level: lvl, hanzi: entry.hanzi, jyutping: entry.jyutping });
    }
  }
  
  // Re-serialize the array
  const jsonArr = JSON.stringify(newArr, null, 2);
  // Rebuild the file
  const newCode = preamble + jsonArr + ';\n';
  fs.writeFileSync(filePath, newCode, 'utf8');
  
  report.fixed[lvl] = fixedCount;
  report.removed[lvl] = removedCount;
  totalFixed += fixedCount;
  totalRemoved += removedCount;
  
  console.log('Level ' + lvl + ': ' + fixedCount + ' fixed, ' + removedCount + ' removed (was ' + arr.length + ', now ' + newArr.length + ')');
}

console.log('\n=== SUMMARY ===');
console.log('Total fixed: ' + totalFixed);
console.log('Total removed (no definition in any dataset): ' + totalRemoved);
console.log('Unfixable entries removed:');
report.unfixable.forEach(e => console.log('  ' + e.id + ' | L' + e.level + ' | ' + e.hanzi + ' (' + e.jyutping + ')'));
