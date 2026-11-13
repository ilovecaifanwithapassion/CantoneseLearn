/**
 * CantoneseLearn Data Build Pipeline
 * Merges and cross-checks open Cantonese dictionaries:
 * - CC-Canto (CC BY-SA 3.0)
 * - CC-CEDICT (CC BY-SA 4.0)
 * - Words.hk open dictionary data (CC BY 4.0)
 * - Rime-cantonese (CC BY 4.0)
 * - Cifu Cantonese Corpus Frequency Lexicon (GPL v3)
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

console.log('=== Starting Cantonese Vocab Build Pipeline ===');

// --- 1. Load CC-Canto ---
console.log('1. Loading CC-Canto...');
const cccPath = path.join(__dirname, 'raw', 'cccanto.txt');
const cccDict = new Map();
if (fs.existsSync(cccPath)) {
  const cccLines = fs.readFileSync(cccPath, 'utf-8').split('\n');
  for (let line of cccLines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\{([^\}]+)\}\s+\/(.+)\/$/);
    if (m) {
      const trad = m[1];
      const jp = m[4].trim().toLowerCase().replace(/\s+/g, ' ');
      const defs = m[5].split('/').filter(Boolean).map(s => s.trim());
      if (!cccDict.has(trad)) {
        cccDict.set(trad, { jp, defs, english: defs.slice(0, 3).join('; ') });
      }
    }
  }
  console.log(`✓ CC-Canto parsed: ${cccDict.size} entries.`);
}

// --- 2. Load CC-CEDICT ---
console.log('2. Loading CC-CEDICT...');
const cedictPath = path.join(__dirname, 'raw', 'cedict.txt');
const cedictDict = new Map();
if (fs.existsSync(cedictPath)) {
  const cedictLines = fs.readFileSync(cedictPath, 'utf-8').split('\n');
  for (let line of cedictLines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/);
    if (m) {
      const trad = m[1];
      const pinyin = m[3];
      const defs = m[4].split('/').filter(Boolean).map(s => s.trim());
      if (!cedictDict.has(trad)) {
        cedictDict.set(trad, { pinyin, defs, english: defs.slice(0, 3).join('; ') });
      }
    }
  }
  console.log(`✓ CC-CEDICT parsed: ${cedictDict.size} entries.`);
}

// --- 3. Load Rime Cantonese ---
console.log('3. Loading Rime-Cantonese words & chars...');
const rimeWordsPath = path.join(__dirname, 'raw', 'rime-cantonese-words.yaml');
const rimeCharsPath = path.join(__dirname, 'raw', 'rime-cantonese-chars.yaml');
const rimeDict = new Map();

function parseRimeYaml(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('---') || line.startsWith('...')) continue;
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const word = parts[0].trim();
      const jp = parts[1].trim().toLowerCase().replace(/\s+/g, ' ');
      if (!rimeDict.has(word)) {
        rimeDict.set(word, jp);
      }
    }
  }
}
parseRimeYaml(rimeWordsPath);
parseRimeYaml(rimeCharsPath);
console.log(`✓ Rime-Cantonese parsed: ${rimeDict.size} entries.`);

// --- 4. Load Cifu Spoken Frequency Lexicon ---
console.log('4. Loading Cifu Spoken Frequency Lexicon...');
const cifuPath = path.join(__dirname, 'raw', 'cifu_frequency.txt');
const freqMap = new Map();
if (fs.existsSync(cifuPath)) {
  const cifuLines = fs.readFileSync(cifuPath, 'utf-8').split('\n');
  for (let i = 1; i < cifuLines.length; i++) {
    const parts = cifuLines[i].split('\t');
    if (parts.length >= 6) {
      const word = parts[0].trim();
      const jp = parts[1].trim().toLowerCase().replace(/\s+/g, ' ');
      const spokenAdult = parseFloat(parts[4]) || 0;
      const def = parts[12] ? parts[12].trim() : '';
      if (word && !freqMap.has(word)) {
        freqMap.set(word, { freq: spokenAdult, jp, def, rank: i });
      }
    }
  }
  console.log(`✓ Cifu frequency parsed: ${freqMap.size} entries.`);
}

// --- 5. Load Words.hk SQLite DB ---
console.log('5. Loading Words.hk SQLite DB...');
const whkPath = path.join(__dirname, 'raw', 'wordshk_dict.db');
const whkEntries = [];
if (fs.existsSync(whkPath)) {
  const db = new DatabaseSync(whkPath);
  const rows = db.prepare('SELECT id, entry FROM rich_dict').all();
  console.log(`Processing ${rows.length} entries from Words.hk...`);

  for (const row of rows) {
    try {
      const data = JSON.parse(row.entry);
      if (!data.v || !data.v[0]) continue;
      const hanzi = data.v[0].w;
      if (!hanzi || hanzi.length > 8) continue;

      let jp = '';
      if (data.v[0].p && data.v[0].p[0]) {
        jp = data.v[0].p[0].map(syl => {
          if (!syl.S) return '';
          const i = syl.S.i ? syl.S.i.toLowerCase() : '';
          const n = syl.S.n ? syl.S.n.toLowerCase() : '';
          const c = syl.S.c ? syl.S.c.toLowerCase() : '';
          const t = syl.S.t ? syl.S.t.replace('T', '') : '';
          return i + n + c + t;
        }).filter(Boolean).join(' ');
      }

      const posList = data.p || [];
      const pos = posList.length > 0 ? posList.join(', ') : 'noun';

      const labels = data.l || [];
      const tags = [];
      if (labels.some(l => l.includes('俚語') || l.includes('潮語'))) tags.push('slang');
      if (labels.some(l => l.includes('粗俗') || l.includes('粗口') || l.includes('忌諱'))) tags.push('vulgar');
      if (labels.some(l => l.includes('口語') || l.includes('日常'))) tags.push('colloquial');
      if (labels.some(l => l.includes('書面語') || l.includes('文言') || l.includes('正式'))) tags.push('formal');
      if (tags.length === 0) tags.push('colloquial');

      let english = '';
      if (data.d && data.d.length > 0) {
        for (const defObj of data.d) {
          if (defObj.e && defObj.e.length > 0) {
            const engParts = [];
            for (const item of defObj.e) {
              if (Array.isArray(item)) {
                for (const sub of item) {
                  if (Array.isArray(sub) && sub[1]) engParts.push(sub[1]);
                  else if (typeof sub === 'string') engParts.push(sub);
                }
              }
            }
            if (engParts.length > 0) {
              english = engParts.join('; ').replace(/\s+/g, ' ').trim();
              break;
            }
          }
        }
      }

      let example = null;
      if (data.d && data.d[0] && data.d[0].eg && data.d[0].eg.length > 0) {
        const egObj = data.d[0].eg[0];
        let egYue = '';
        let egJp = '';
        let egEng = '';

        if (egObj.y && egObj.y.R) {
          const chars = [];
          const jps = [];
          for (const item of egObj.y.R) {
            if (item.W) {
              chars.push(item.W[0][0][1]);
              jps.push(item.W[1][0]);
            } else if (item.P) {
              chars.push(item.P);
            }
          }
          egYue = chars.join('');
          egJp = jps.join(' ');
        }

        if (egObj.e && egObj.e[0] && egObj.e[0][1]) {
          egEng = egObj.e[0][1];
        }

        if (egYue && egEng) {
          example = {
            hanzi: egYue,
            jyutping: egJp || '',
            english: egEng,
            generated: false
          };
        }
      }

      whkEntries.push({
        hanzi,
        jp,
        pos,
        tags,
        english,
        example,
        labels
      });
    } catch (e) {}
  }
  console.log(`✓ Words.hk valid parsed entries: ${whkEntries.length}.`);
}

// --- 6. Merge & Cross-Check Dictionary ---
console.log('6. Merging datasets and cross-checking Jyutping...');

const allCandidateWords = new Map();

function addCandidate(hanzi) {
  if (!hanzi || hanzi.length > 6) return false;
  if (!allCandidateWords.has(hanzi)) {
    allCandidateWords.set(hanzi, {
      hanzi,
      whk: null,
      ccc: null,
      rime: null,
      cifu: null,
      cedict: null
    });
  }
  return true;
}

for (const item of whkEntries) {
  if (addCandidate(item.hanzi)) {
    allCandidateWords.get(item.hanzi).whk = item;
  }
}

for (const [hanzi, cccItem] of cccDict.entries()) {
  if (addCandidate(hanzi)) {
    allCandidateWords.get(hanzi).ccc = cccItem;
  }
}

for (const [hanzi, cifuItem] of freqMap.entries()) {
  if (addCandidate(hanzi)) {
    allCandidateWords.get(hanzi).cifu = cifuItem;
  }
}

for (const [hanzi, entry] of allCandidateWords.entries()) {
  if (rimeDict.has(hanzi)) entry.rime = rimeDict.get(hanzi);
  if (cedictDict.has(hanzi)) entry.cedict = cedictDict.get(hanzi);
}

console.log(`Total unique candidate words gathered: ${allCandidateWords.size}`);

// --- 7. Topic & Level Categorization Logic ---
const topicKeywords = {
  greetings: ['hello', 'bye', 'good morning', 'greet', 'welcome', 'morning', 'night', 'see you', 'thanks', 'thank', 'sorry', 'excuse'],
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'ten thousand', 'zero', 'first', 'second', 'both', 'half', 'quarter', 'number', 'count'],
  family: ['father', 'mother', 'brother', 'sister', 'son', 'daughter', 'parent', 'baby', 'grandfather', 'grandmother', 'aunt', 'uncle', 'cousin', 'husband', 'wife', 'family', 'child', 'children', 'friend', 'boy', 'girl'],
  food: ['eat', 'food', 'drink', 'rice', 'tea', 'noodle', 'bread', 'water', 'meat', 'chicken', 'beef', 'pork', 'fish', 'soup', 'egg', 'vegetable', 'fruit', 'apple', 'lemon', 'coffee', 'milk', 'beer', 'sugar', 'salt', 'sweet', 'sour', 'bitter', 'spicy', 'restaurant', 'delicious', 'cook', 'meal'],
  colors: ['color', 'red', 'blue', 'green', 'yellow', 'black', 'white', 'orange', 'purple', 'grey', 'brown', 'pink', 'dark', 'bright'],
  days: ['day', 'today', 'tomorrow', 'yesterday', 'week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'month', 'year', 'morning', 'afternoon', 'evening', 'night', 'time', 'clock', 'hour', 'minute'],
  basic_verbs: ['to be', 'is', 'are', 'have', 'do', 'go', 'come', 'see', 'look', 'watch', 'listen', 'hear', 'say', 'speak', 'talk', 'tell', 'walk', 'run', 'read', 'write', 'buy', 'give', 'take', 'make', 'get', 'know', 'think', 'want', 'like', 'sleep', 'live', 'stay', 'find', 'wear'],
  pronouns_particles: ['i', 'me', 'you', 'he', 'she', 'it', 'we', 'us', 'they', 'them', 'this', 'that', 'here', 'there', 'who', 'what', 'where', 'why', 'how', 'which', 'particle', 'question particle', 'modal particle'],
  transport: ['car', 'bus', 'train', 'subway', 'station', 'taxi', 'airport', 'plane', 'flight', 'ticket', 'walk', 'drive', 'ride', 'road', 'street', 'bridge', 'traffic', 'stop'],
  shopping: ['buy', 'sell', 'price', 'money', 'dollar', 'cent', 'cheap', 'expensive', 'pay', 'shop', 'store', 'market', 'cash', 'discount', 'change', 'bill', 'receipt'],
  weather: ['weather', 'rain', 'snow', 'wind', 'hot', 'cold', 'warm', 'cool', 'sun', 'cloud', 'typhoon', 'humid', 'temperature', 'storm'],
  body: ['head', 'eye', 'ear', 'nose', 'mouth', 'face', 'hair', 'hand', 'arm', 'foot', 'leg', 'body', 'heart', 'tooth', 'stomach', 'neck'],
  feelings: ['happy', 'sad', 'angry', 'scared', 'tired', 'bored', 'busy', 'worried', 'excited', 'love', 'like', 'hate', 'pain', 'hungry', 'thirsty'],
  work: ['work', 'job', 'company', 'office', 'boss', 'meeting', 'salary', 'career', 'business', 'staff', 'colleague', 'manager', 'computer', 'interview'],
  school: ['school', 'study', 'learn', 'student', 'teacher', 'class', 'exam', 'test', 'homework', 'book', 'university', 'college', 'subject'],
  travel: ['travel', 'trip', 'hotel', 'passport', 'luggage', 'visit', 'tourist', 'sightseeing', 'vacation', 'holiday', 'beach', 'mountain', 'map'],
  health: ['health', 'doctor', 'hospital', 'medicine', 'sick', 'ill', 'fever', 'cough', 'clinic', 'dentist', 'wound', 'pain', 'treatment', 'nurse'],
  hobbies: ['hobby', 'game', 'play', 'movie', 'film', 'music', 'song', 'sing', 'dance', 'swim', 'sport', 'football', 'basketball', 'read', 'draw'],
  idioms: ['idiom', 'proverb', 'saying', 'four-character'],
  slang: ['slang', 'colloquial', 'street', 'cantonese slang', 'gen-z', 'buzzword', 'vulgar']
};

function assignTopic(hanzi, english, tags, labels) {
  const engLower = (english || '').toLowerCase();
  if (tags.includes('slang') || tags.includes('vulgar') || labels.some(l => l.includes('俚語'))) return 'slang';
  if (hanzi.length === 4 && (tags.includes('formal') || engLower.includes('idiom') || engLower.includes('fig.'))) return 'idioms';

  for (const [topic, words] of Object.entries(topicKeywords)) {
    for (const w of words) {
      if (engLower.includes(w)) return topic;
    }
  }

  // Character heuristics
  if (/[零一二兩三四五六七八九十百千萬億第個隻條杯件]/.test(hanzi)) return 'numbers';
  if (/[日月年時分星期禮拜晨夜晚春夏秋冬]/.test(hanzi)) return 'days';
  if (/[食飲飯茶酒肉菜果糖鹽麵糕餅甜酸辣]/.test(hanzi)) return 'food';
  if (/[車船路街站飛機鐵]/.test(hanzi)) return 'transport';
  if (/[錢買賣貴平蚊銀找減]/.test(hanzi)) return 'shopping';
  if (/[雨風天晴冷熱涼濕暖]/.test(hanzi)) return 'weather';
  if (/[身首頭手足眼耳口心臉皮毛骨]/.test(hanzi)) return 'body';
  if (/[食行睇聽講寫讀買賣畀搵著瞓走嚟去喺有冇係做識諗想要]/.test(hanzi) && hanzi.length <= 2) return 'basic_verbs';
  if (/[我你佢誰乜點啦啊嘅喎咩呢嘛呀]/.test(hanzi) && hanzi.length <= 2) return 'pronouns_particles';

  return 'daily';
}

// Build merged candidate list
const mergedList = [];

for (const [hanzi, entry] of allCandidateWords.entries()) {
  let jp = '';
  let english = '';
  let pos = 'noun';
  let tags = ['colloquial'];
  let example = null;
  const labels = entry.whk ? entry.whk.labels : [];

  if (entry.whk && entry.whk.jp) {
    jp = entry.whk.jp;
    english = entry.whk.english;
    pos = entry.whk.pos;
    tags = entry.whk.tags;
    example = entry.whk.example;
  } else if (entry.ccc && entry.ccc.jp) {
    jp = entry.ccc.jp;
    english = entry.ccc.english;
    pos = 'word';
  } else if (entry.cifu && entry.cifu.jp) {
    jp = entry.cifu.jp;
    english = entry.cifu.def;
    pos = 'word';
  }

  if ((!english || english.length < 2) && entry.cedict) {
    english = entry.cedict.english;
  }

  const sourcesAgree = [];
  const sourcesAll = [];
  const notes = [];

  const normJp = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (entry.whk && entry.whk.jp) sourcesAll.push('Words.hk');
  if (entry.ccc && entry.ccc.jp) {
    sourcesAll.push('CC-Canto');
    if (normJp(entry.ccc.jp) === normJp(jp)) sourcesAgree.push('CC-Canto');
    else notes.push(`CC-Canto: ${entry.ccc.jp}`);
  }
  if (entry.rime) {
    sourcesAll.push('Rime');
    if (normJp(entry.rime) === normJp(jp)) sourcesAgree.push('Rime');
    else notes.push(`Rime: ${entry.rime}`);
  }
  if (entry.cifu && entry.cifu.jp) {
    sourcesAll.push('Cifu');
    if (normJp(entry.cifu.jp) === normJp(jp)) sourcesAgree.push('Cifu');
    else notes.push(`Cifu: ${entry.cifu.jp}`);
  }

  const isVerified = sourcesAgree.length >= 1;
  const verify = !isVerified;

  if (sourcesAll.length === 1) notes.push(`Single source: ${sourcesAll[0]}`);

  const freq = entry.cifu ? entry.cifu.freq : 0;
  const rank = entry.cifu ? entry.cifu.rank : 999999;

  if (!english || !jp || !/[1-6]/.test(jp)) continue;
  english = english.replace(/\s+/g, ' ').slice(0, 140).trim();

  const topic = assignTopic(hanzi, english, tags, labels);

  mergedList.push({
    hanzi,
    jyutping: jp,
    english,
    pos,
    tags,
    sources: sourcesAll.join(' + '),
    verify,
    notes: notes.join('; '),
    example,
    freq,
    rank,
    topic,
    isSlang: tags.includes('slang') || topic === 'slang',
    isIdiom: topic === 'idioms' || (hanzi.length === 4 && (tags.includes('formal') || english.includes('idiom')))
  });
}

console.log(`Merged candidate entries ready for leveling: ${mergedList.length}`);

// --- 8. Distribute into Levels 1 - 6 ---
const levels = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

const level1Topics = new Set(['greetings', 'numbers', 'family', 'food', 'colors', 'days', 'basic_verbs', 'pronouns_particles']);
const level2Topics = new Set(['transport', 'shopping', 'weather', 'body', 'feelings', 'daily']);
const level3Topics = new Set(['work', 'school', 'travel', 'health', 'hobbies']);

for (const item of mergedList) {
  if (item.isSlang || item.tags.includes('vulgar')) {
    levels[6].push(item);
  } else if (item.isIdiom) {
    levels[5].push(item);
  } else if (level1Topics.has(item.topic) && item.rank <= 2500) {
    levels[1].push(item);
  } else if ((level1Topics.has(item.topic) || level2Topics.has(item.topic)) && item.rank <= 3500) {
    levels[2].push(item);
  } else if (level3Topics.has(item.topic) || item.rank <= 5500) {
    levels[3].push(item);
  } else if (item.rank <= 12000) {
    levels[4].push(item);
  } else if (item.hanzi.length >= 4) {
    levels[5].push(item);
  } else {
    levels[4].push(item);
  }
}

// Target numbers:
const targetPerLevel = {
  1: 420,
  2: 450,
  3: 450,
  4: 420,
  5: 380,
  6: 380
};

const finalLevels = {};

for (let lvl = 1; lvl <= 6; lvl++) {
  // Sort naturally by frequency rank
  levels[lvl].sort((a, b) => b.freq - a.freq);

  const seen = new Set();
  const deduped = [];
  for (const item of levels[lvl]) {
    if (!seen.has(item.hanzi)) {
      seen.add(item.hanzi);
      deduped.push(item);
      if (deduped.length >= targetPerLevel[lvl]) break;
    }
  }

  finalLevels[lvl] = deduped.map((item, idx) => {
    let ex = item.example;
    if (!ex) {
      ex = {
        hanzi: `${item.hanzi}好常用。`,
        jyutping: `${item.jyutping} hou2 soeng4 jung6.`,
        english: `"${item.english.split(';')[0]}" is very commonly used in Cantonese.`,
        generated: true
      };
    }

    return {
      id: `l${lvl}-${String(idx + 1).padStart(4, '0')}`,
      hanzi: item.hanzi,
      jyutping: item.jyutping,
      english: item.english,
      pos: item.pos,
      level: lvl,
      topic: item.topic,
      tags: item.tags,
      source: item.sources || 'CC-Canto + Words.hk',
      verify: item.verify,
      example: ex,
      notes: item.notes || (item.verify ? 'Single-source entry or variant tone mark; verify before formal usage.' : 'Cross-checked and verified across Cantonese dictionaries.')
    };
  });

  console.log(`✓ Finalized Level ${lvl}: ${finalLevels[lvl].length} words.`);
}

// --- 9. Output js/data/level1.js ... level6.js ---
console.log('9. Writing level files to js/data/...');
const dataDir = path.join(__dirname, '..', 'js', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

for (let lvl = 1; lvl <= 6; lvl++) {
  const filePath = path.join(dataDir, `level${lvl}.js`);
  const content = `/**
 * CantoneseLearn - Level ${lvl} Vocabulary Data
 * Generated from CC-Canto, Words.hk, CC-CEDICT, and Rime-Cantonese
 */
window.CANTONESE_LEVEL_${lvl} = ${JSON.stringify(finalLevels[lvl], null, 2)};
`;
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Saved ${filePath} (${finalLevels[lvl].length} items)`);
}

// Write manual-slang.js
const manualSlangPath = path.join(dataDir, 'manual-slang.js');
const manualSlangData = [
  {
    id: "ms-001",
    hanzi: "搞掂",
    jyutping: "gaau2 dim2",
    english: "all settled; mission accomplished; sorted out",
    pos: "verb",
    level: 6,
    topic: "slang",
    tags: ["colloquial", "slang"],
    source: "Manual Curated + Words.hk",
    verify: false,
    example: {
      hanzi: "放心啦，呢單嘢我已經搞掂咗！",
      jyutping: "fong3 sam1 laa1, ni1 daan1 je5 ngo5 ji5 ging1 gaau2 dim2 zo2!",
      english: "Don't worry, I have already sorted this matter out!",
      generated: false
    },
    notes: "Essential Hong Kong everyday phrase for completing a task successfully."
  },
  {
    id: "ms-002",
    hanzi: "好正",
    jyutping: "hou2 zeng3",
    english: "awesome; fantastic; top-notch",
    pos: "adjective",
    level: 6,
    topic: "slang",
    tags: ["colloquial", "slang"],
    source: "Manual Curated + Words.hk",
    verify: false,
    example: {
      hanzi: "呢間茶餐廳嘅蛋撻好正！",
      jyutping: "ni1 gaan1 caan1 teng1 ge3 daan6 taat1 hou2 zeng3!",
      english: "The egg tarts at this cha chaan teng are superb!",
      generated: false
    },
    notes: "Universal approval for food, atmosphere, or people."
  },
  {
    id: "ms-003",
    hanzi: "屈機",
    jyutping: "wat1 gei1",
    english: "overpowered; overwhelmingly dominant",
    pos: "adjective",
    level: 6,
    topic: "slang",
    tags: ["slang"],
    source: "Words.hk",
    verify: false,
    example: {
      hanzi: "佢打機咁屈機，邊個夠佢打？",
      jyutping: "keoi5 daa2 gei1 gam3 wat1 gei1, bin1 go3 gau3 keoi5 daa2?",
      english: "He plays so overpoweringly well, who could beat him?",
      generated: false
    },
    notes: "Originates from arcade fighting games where a character traps the opponent."
  },
  {
    id: "ms-004",
    hanzi: "chok",
    jyutping: "cok3",
    english: "strike a cool pose; deliberately act stylish or brooding",
    pos: "verb",
    level: 6,
    topic: "slang",
    tags: ["slang"],
    source: "Manual Curated + Words.hk",
    verify: true,
    example: {
      hanzi: "影張相啫，唔使咁 chok 呀嘛？",
      jyutping: "jing2 zoeng1 soeng2 ze1, m4 sai2 gam3 cok3 aa3 maa3?",
      english: "It is just a photo, no need to strike such an edgy pose!",
      generated: false
    },
    notes: "Hong Kong English-Cantonese hybrid popular in entertainment media."
  },
  {
    id: "ms-005",
    hanzi: "仆街",
    jyutping: "puk1 gaai1",
    english: "drop dead; bastard; damn it (18+ coarse swear)",
    pos: "interjection",
    level: 6,
    topic: "slang",
    tags: ["slang", "vulgar"],
    source: "Words.hk + CC-Canto",
    verify: false,
    example: {
      hanzi: "仆街，我唔記得帶鎖匙出門口！",
      jyutping: "puk1 gaai1, ngo5 m4 gei3 dak1 daai3 so2 si4 ceot1 mun4 hau2!",
      english: "Damn it, I forgot to bring my keys when leaving!",
      generated: false
    },
    notes: "Quintessential HK curse word, tagged 18+ with blur-to-reveal."
  }
];

fs.writeFileSync(manualSlangPath, `/**
 * CantoneseLearn - Manually Curated Slang
 */
window.CANTONESE_MANUAL_SLANG = ${JSON.stringify(manualSlangData, null, 2)};
`, 'utf-8');

console.log('=== Build Pipeline Completed Successfully! ===');
