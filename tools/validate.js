/**
 * CantoneseLearn - Dataset Validator
 * Checks all fields exist, tone numbers are 1-6, no duplicates, no empty meanings,
 * and prints a report of every `verify: true` entry.
 */

const fs = require('fs');
const path = require('path');

console.log('=== Starting Vocab Dataset Validation ===\n');

const dataDir = path.join(__dirname, '..', 'js', 'data');
const levels = [1, 2, 3, 4, 5, 6];

const requiredFields = ['id', 'hanzi', 'jyutping', 'english', 'pos', 'level', 'topic', 'tags', 'source', 'verify', 'example', 'notes'];

let totalWords = 0;
let totalVerified = 0;
let totalFlagged = 0;
const seenIds = new Set();
const seenHanzi = new Set();
const validationErrors = [];
const flaggedEntries = [];

for (const lvl of levels) {
  const filePath = path.join(dataDir, `level${lvl}.js`);
  if (!fs.existsSync(filePath)) {
    validationErrors.push(`Missing file: ${filePath}`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  // Extract JSON payload
  const jsonMatch = content.match(/window\.CANTONESE_LEVEL_\d+\s*=\s*(\[[\s\S]*?\]);\s*$/);
  if (!jsonMatch) {
    validationErrors.push(`Failed to parse array in ${filePath}`);
    continue;
  }

  let list = [];
  try {
    list = JSON.parse(jsonMatch[1]);
  } catch (e) {
    validationErrors.push(`JSON syntax error in ${filePath}: ${e.message}`);
    continue;
  }

  console.log(`Checking Level ${lvl} (${list.length} words)...`);

  list.forEach((item, idx) => {
    totalWords++;

    // 1. Check all required fields
    for (const f of requiredFields) {
      if (item[f] === undefined || item[f] === null) {
        validationErrors.push(`[${item.id || 'idx ' + idx}] Missing required field: ${f}`);
      }
    }

    // 2. No duplicates
    if (seenIds.has(item.id)) {
      validationErrors.push(`Duplicate ID: ${item.id}`);
    } else {
      seenIds.add(item.id);
    }

    if (seenHanzi.has(item.hanzi)) {
      validationErrors.push(`Duplicate Hanzi across levels: ${item.hanzi} (${item.id})`);
    } else {
      seenHanzi.add(item.hanzi);
    }

    // 3. No empty meanings or "NO DEF"
    if (!item.english || !item.english.trim() || item.english.toUpperCase().includes('NO DEF')) {
      validationErrors.push(`[${item.id}] Invalid/Empty English meaning ("${item.english}") for hanzi: ${item.hanzi}`);
    }

    // 4. Tone numbers must be 1-6
    const syllables = item.jyutping.split(/\s+/).filter(Boolean);
    for (const syl of syllables) {
      const toneMatch = syl.match(/[1-6]$/);
      if (!toneMatch) {
        validationErrors.push(`[${item.id}] Invalid tone in syllable "${syl}" for hanzi "${item.hanzi}"`);
      }
    }

    // 5. Example validation
    if (!item.example || !item.example.hanzi || !item.example.english) {
      validationErrors.push(`[${item.id}] Incomplete example object for hanzi: ${item.hanzi}`);
    }

    // 6. Track verification
    if (item.verify === true) {
      totalFlagged++;
      flaggedEntries.push({
        id: item.id,
        level: item.level,
        hanzi: item.hanzi,
        jyutping: item.jyutping,
        english: item.english,
        source: item.source,
        notes: item.notes
      });
    } else {
      totalVerified++;
    }
  });
}

console.log('\n=======================================');
console.log('       DATASET VALIDATION REPORT       ');
console.log('=======================================');
console.log(`Total Words Scanned: ${totalWords}`);
console.log(`Verified (2+ sources): ${totalVerified} (${((totalVerified / totalWords) * 100).toFixed(1)}%)`);
console.log(`Flagged (verify: true): ${totalFlagged} (${((totalFlagged / totalWords) * 100).toFixed(1)}%)`);

if (validationErrors.length > 0) {
  console.error(`\n❌ Found ${validationErrors.length} validation errors:`);
  validationErrors.slice(0, 20).forEach(err => console.error('  - ' + err));
  if (validationErrors.length > 20) console.error(`  ... and ${validationErrors.length - 20} more errors.`);
  process.exit(1);
} else {
  console.log('\n✅ ALL STRUCTURAL CHECKS PASSED:');
  console.log('  ✓ All required fields present');
  console.log('  ✓ All Jyutping syllables have valid tone numbers (1-6)');
  console.log('  ✓ No duplicate IDs or duplicate Hanzi entries');
  console.log('  ✓ No empty English glosses');
}

console.log('\n--- SAMPLE FLAGGED ENTRIES (verify: true) ---');
flaggedEntries.slice(0, 15).forEach((f, i) => {
  console.log(`${i + 1}. [${f.id}] Level ${f.level} · ${f.hanzi} (${f.jyutping}) - ${f.english}`);
  console.log(`   Source: ${f.source} | Notes: ${f.notes}`);
});
console.log(`\n(Total flagged: ${flaggedEntries.length}. In the UI, these display a "Needs checking" badge and are excluded from default Learn lessons.)\n`);
