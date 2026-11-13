# CantoneseLearn 廣東話 · Personal Study Platform & Leveled Lexicon

A comprehensive personal Cantonese learning platform built strictly with **vanilla HTML, CSS, and JavaScript** (zero build step, zero framework dependencies, runs locally offline or via a simple static file server). Designed with an **Apple-inspired aesthetic** (clean system typography, glassy blurred nav, smooth 60fps animations, dark/light themes) and powered by an **offline data build pipeline** from authoritative Cantonese dictionaries.

---

## 🌟 Key Features

### 1. Accurate Leveled Vocabulary Library (2,500 Words)
- **Built from Real Dictionaries**: Generated from CC-Canto, CC-CEDICT, Words.hk (粵典), Rime-Cantonese, and Cifu Spoken Frequency Corpus. Zero AI memory hallucination for Jyutping and definitions.
- **Cross-Checked Readings**: Every entry is cross-referenced across at least two independent sources. High-confidence entries display `Verified (2+ sources)`. Tone variants or single-source entries are transparently flagged as `Needs checking` with notes explaining the dialectal sandhi.
- **6 CEFR-Aligned Proficiency Levels**:
  - **Level 1 (Beginner - 420 words)**: Greetings, numbers, family, food, colors, calendar, foundational verbs.
  - **Level 2 (Elementary - 450 words)**: Daily life, shopping, transit, time, weather, body, feelings.
  - **Level 3 (Intermediate - 450 words)**: Work, school, travel, health, leisure, opinions, connectors.
  - **Level 4 (Upper-Intermediate - 420 words)**: News, relationships, tech, emotions, abstract concepts.
  - **Level 5 (Advanced - 380 words)**: Four-character idioms (成語), formal vs. colloquial register, business, HK cultural concepts.
  - **Level 6 (Pro & Slang - 380 words)**: Heavy colloquialisms, internet/Gen-Z slang, allegorical sayings (歇後語), vivid HK expressions.
- **Interactive Library UI**:
  - Filter by level (L1–L6), topic categories, and tags (`formal`, `colloquial`, `slang`, `vulgar 18+`).
  - Search in English, Traditional Chinese (繁體), or Jyutping.
  - "Include unverified words in lessons" settings toggle.
  - "Report a mistake" modal storing local feedback to `localStorage`.
  - Verification status badges on every card.

### 2. Duolingo-Style Interactive Learning System
- **Winding Skill Tree**: Units 1–9 presented as circular glowing nodes with lock/current/complete states and lively bounce animations.
- **Dynamic Lesson Generator**: Draws 10 exercises per session from ~6–8 words matching the active unit and level, blending new terms with spaced review.
- **8 Exercise Types**:
  1. *Multiple Choice*: Hanzi to English & English to Hanzi.
  2. *Listen & Choose*: Web Speech synthesis playback with distractors.
  3. *Word Bank Sentence Builder*: Interactive tap-to-assemble / tap-to-remove word bank.
  4. *Type the Answer*: Hanzi / Jyutping spelling drill.
  5. *Match Pairs*: Interactive 5-pair card matching game.
  6. *Tone Challenge*: 6-button tone pitch discrimination test.
  7. *Fill in the Blank*: Contextual cloze test for sentence particles and verbs.
  8. *Write It*: Stroke-order character tracing powered by local `HanziWriter`.
- **Game Mechanics**:
  - 5 Hearts system with mistakes deducting hearts and visual shake.
  - Slide-up bottom feedback drawer (Green "Nice!" / Red with explanation and correct answer).
  - Synthetic Web Audio API sound effects (correct chime, wrong thud, level up fanfares).
  - Multi-burst celebratory confetti on lesson completion.
  - "Practice Weak Words" and "Test Out" unit skips.
- **Spaced Repetition (SRS)**:
  - 4-Box Leitner review system tracking word mastery.
  - Interactive Leitner box inspection modal and 7-day activity graph.

### 3. Core Cultural Curriculum & Original Study Modules
- **Basics**: Spoken Cantonese (口語) vs. Formal Written Chinese (書面語), Traditional vs. Simplified.
- **Jyutping Chart & Tone Pitch Curve**: Interactive pitch contours for all 6 tones with synthetic frequency sweeps.
- **Essential Phrases & Daily Scenarios**: Cha Chaan Teng shorthand (`少甜`, `走冰`, `行街`), minibus calls (`有落！`), and `唔該` vs. `多謝` distinctions.
- **Grammar Guide**: Sentence Final Particles (`啦`, `喎`, `啊`, `嘅`, `咩`), Classifiers, and Negators (`唔` vs `冇` vs `咪`).
- **Slang & Street Talk**: Iconic idioms (`搞掂`, `好正`, `chok`, `無厘頭`, `發夢`, `屈機`), plus 18+ vulgar expressions behind a blur-to-reveal filter.
- **Writing Studio**:
  - HanziWriter animated stroke order trainer with local offline glyph cache.
  - Free Draw Canvas with 田字格 practice grid, undo, and guide watermark.
  - Jyutping typing drill.

---

## 🛠️ Offline Data Build Pipeline

All leveled vocabulary files (`js/data/level1.js` through `level6.js`) are generated programmatically by the Node.js build pipeline located in `/tools`.

### 1. Raw Datasets in `/tools/raw/`
The build pipeline aggregates from five open linguistic resources:
- `cccanto.txt`: CC-Canto Cantonese-English Dictionary (Cantonese.org, CC BY-SA 3.0).
- `cedict.txt`: CC-CEDICT Chinese-English Dictionary (MDBG, CC BY-SA 4.0).
- `wordshk_dict.db`: Words.hk (粵典) SQLite database containing 51,899 entries and 140,000+ real spoken example sentences (CC BY 4.0).
- `rime-cantonese-words.yaml`, `rime-cantonese-chars.yaml`: Rime Cantonese phonetic schema (CC BY 4.0).
- `cifu_frequency.txt`: Cifu Cantonese Spoken Corpus frequency lexicon (GPL v3).

### 2. Running the Pipeline
If you wish to re-download raw datasets or regenerate the lexicon:

```bash
# 1. Download raw dictionary datasets into /tools/raw/
node tools/download.js

# 2. Build, cross-check, and partition into leveled data files
node tools/build.js

# 3. Validate data integrity and verify status
node tools/validate.js
```

### 3. Pipeline Processing Rules
1. **Deduplication & Canonical Keys**: Entries are keyed by Traditional Chinese characters.
2. **Multi-Source Cross-Check**:
   - Jyutping is extracted from CC-Canto, Words.hk phonology, and Rime-Cantonese.
   - Entries with agreeing romanization across 2+ sources are marked `verify: false` (`Verified (2+ sources)` in UI).
   - Entries with variant tones (e.g. colloquial tone sandhi `mou2` vs `mou5`) or single-source coverage are marked `verify: true` (`Needs checking` in UI) and document both readings in the `notes` field.
3. **CEFR Level Cutoffs**:
   - **Level 1**: Top 420 spoken frequency words (Cifu rank ≤ 500, core daily concepts).
   - **Level 2**: Frequency rank 501–1,200 (elementary communication).
   - **Level 3**: Frequency rank 1,201–2,500 (intermediate discourse).
   - **Level 4**: Frequency rank 2,501–4,500 (upper intermediate / specialized).
   - **Level 5**: Advanced 4-character idioms (成語) and formal register entries.
   - **Level 6**: High-colloquialism slang, internet memes, and Words.hk colloquial tags.
4. **Real Example Sentences**: Extracted directly from Words.hk natural spoken corpus with character-aligned Jyutping and English glosses. Any synthetic fallback is explicitly flagged with `example.generated = true` and rendered with an "AI-written" badge.

---

## 🚀 Running the Website

### Option A: Local Static Server (Recommended)
Because modern browsers restrict certain local features (such as SpeechSynthesis and Canvas data export under `file://`), run a local server:

```bash
# Using Node.js
node -e "const http = require('http'), fs = require('fs'), path = require('path'); http.createServer((q, r) => { fs.readFile(path.join('.', q.url === '/' ? 'index.html' : q.url.split('?')[0]), (e, d) => { if (e) { r.writeHead(404); r.end('Not found'); } else { r.writeHead(200); r.end(d); } }); }).listen(3000, () => console.log('Live on http://localhost:3000'));"
```
Then visit **http://localhost:3000** in your browser.

### Option B: Direct File Launch
Double click `index.html` in your file explorer.

---

## 📁 Repository Structure

```text
CantoneseLearn/
├── index.html                  # Main application structure (Apple-style UI + Duolingo Learn)
├── README.md                   # System documentation, build instructions & credits
├── css/
│   └── style.css               # Design system, themes, animations, exercise styling
├── js/
│   ├── data.js                 # Central data registry & helper query functions
│   ├── main.js                 # App controller, Duolingo engine, audio synthesizer & SRS
│   ├── data/
│   │   ├── level1.js           # 420 Beginner words
│   │   ├── level2.js           # 450 Elementary words
│   │   ├── level3.js           # 450 Intermediate words
│   │   ├── level4.js           # 420 Upper-Intermediate words
│   │   ├── level5.js           # 380 Advanced & Idioms (成語)
│   │   ├── level6.js           # 380 Pro, Slang & Colloquialisms
│   │   └── manual-slang.js     # Curated street slang & cultural notes
│   └── lib/
│       ├── hanzi-writer.min.js # HanziWriter library (offline)
│       └── stroke-cache.js     # Preloaded stroke JSON for core characters
└── tools/
    ├── download.js             # Raw dataset downloader
    ├── build.js                # Lexicon build, cross-check, and level allocator
    ├── validate.js             # Quality assurance and verification validator
    └── raw/                    # Downloaded dictionary files (CC-Canto, CEDICT, Words.hk, etc.)
```

---

## 📜 Credits & Licenses

This platform is powered by open linguistics projects. Sincere gratitude to all researchers, lexicographers, and open-source contributors:

- **Words.hk (粵典)**:
  - *Data*: Cantonese colloquial definitions, phonology, and real spoken example sentences.
  - *License*: [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
- **CC-Canto**:
  - *Data*: Cantonese-English dictionary and Jyutping romanization.
  - *License*: [Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)](https://creativecommons.org/licenses/by-sa/3.0/).
- **CC-CEDICT (MDBG)**:
  - *Data*: Chinese-English definitions, Traditional Hanzi cross-referencing.
  - *License*: [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
- **Rime Cantonese (rime-cantonese / 粵語拼音方案)**:
  - *Data*: LSHK Jyutping lexical tables and character mappings.
  - *License*: [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
- **Cifu Spoken Cantonese Corpus (PyCantonese)**:
  - *Data*: Frequency distributions of natural spoken Hong Kong Cantonese.
  - *License*: [GNU General Public License v3.0 (GPL v3)](https://www.gnu.org/licenses/gpl-3.0.html).
- **HanziWriter**:
  - *Software*: Hanzi stroke order animations and interactive tracing quizzes.
  - *License*: MIT License.
