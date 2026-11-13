/**
 * Cantonese Learning Platform - Comprehensive Vocabulary, Grammar & Leveled Library
 * Romanization adheres to the Linguistic Society of Hong Kong (LSHK) Jyutping Standard.
 */

window.CANTONESE_DATA = {
  // Tone information & audio pitch simulation values
  tones: [
    {
      tone: 1,
      name: "High Level / High Falling (陰平)",
      pitch: "55 / 53",
      freqStart: 320,
      freqEnd: 320,
      description: "High, steady pitch. Similar to singing a high note or saying 'Ah!' to a doctor.",
      sampleChar: "詩",
      jyutping: "si1",
      meaning: "poem"
    },
    {
      tone: 2,
      name: "High Rising (陰上)",
      pitch: "35",
      freqStart: 230,
      freqEnd: 320,
      description: "Starts in the middle and glides upwards. Like asking an incredulous 'What?!'",
      sampleChar: "史",
      jyutping: "si2",
      meaning: "history"
    },
    {
      tone: 3,
      name: "Mid Level (陰去)",
      pitch: "33",
      freqStart: 250,
      freqEnd: 250,
      description: "Flat, steady in your normal mid conversational speaking voice.",
      sampleChar: "試",
      jyutping: "si3",
      meaning: "try / test"
    },
    {
      tone: 4,
      name: "Low Falling (陽平)",
      pitch: "21",
      freqStart: 180,
      freqEnd: 130,
      description: "Starts low and drops down to the basement of your vocal range. Soft sigh.",
      sampleChar: "時",
      jyutping: "si4",
      meaning: "time"
    },
    {
      tone: 5,
      name: "Low Rising (陽上)",
      pitch: "23",
      freqStart: 160,
      freqEnd: 220,
      description: "Starts low and ascends gently toward the middle. Sounds like a puzzled 'Huh?'",
      sampleChar: "市",
      jyutping: "si5",
      meaning: "market / city"
    },
    {
      tone: 6,
      name: "Low Level (陽去)",
      pitch: "22",
      freqStart: 170,
      freqEnd: 170,
      description: "Flat, steady low pitch, slightly higher than the bottom of tone 4.",
      sampleChar: "事",
      jyutping: "si6",
      meaning: "matter / affair"
    }
  ],

  // Initials (聲母)
  initials: [
    { char: "b", ipa: "[p]", example: "巴 (baa1 - bus)", soundLike: "unaspirated 'p' like 'spin'" },
    { char: "p", ipa: "[pʰ]", example: "跑 (paau2 - run)", soundLike: "aspirated 'p' with puff of air" },
    { char: "m", ipa: "[m]", example: "媽 (maa1 - mother)", soundLike: "'m' as in 'mother'" },
    { char: "f", ipa: "[f]", example: "飛 (fei1 - fly)", soundLike: "'f' as in 'fish'" },
    { char: "d", ipa: "[t]", example: "打 (daa2 - hit)", soundLike: "unaspirated 't' like 'stand'" },
    { char: "t", ipa: "[tʰ]", example: "他 (taa1 - other)", soundLike: "aspirated 't' like 'tea'" },
    { char: "n", ipa: "[n]", example: "你 (nei5 - you)", soundLike: "'n' as in 'nest' (often merges with l)" },
    { char: "l", ipa: "[l]", example: "李 (lei5 - plum/Lee)", soundLike: "'l' as in 'love'" },
    { char: "g", ipa: "[k]", example: "家 (gaa1 - home)", soundLike: "unaspirated 'k' like 'skill'" },
    { char: "k", ipa: "[kʰ]", example: "卡 (kaa1 - card)", soundLike: "aspirated 'k' like 'kite'" },
    { char: "ng", ipa: "[ŋ]", example: "我 (ngo5 - I/me)", soundLike: "'ng' as in 'singer' at start of word" },
    { char: "h", ipa: "[h]", example: "好 (hou2 - good)", soundLike: "'h' as in 'hat'" },
    { char: "gw", ipa: "[kʷ]", example: "廣 (gwong2 - broad)", soundLike: "'gw' like 'Gwen' without voice" },
    { char: "kw", ipa: "[kʷʰ]", example: "誇 (kwaa1 - boast)", soundLike: "'kw' like 'queen'" },
    { char: "w", ipa: "[w]", example: "話 (waa2 - talk)", soundLike: "'w' as in 'water'" },
    { char: "z", ipa: "[ts]", example: "左 (zo2 - left)", soundLike: "'ts' or 'dz' as in 'cats'" },
    { char: "c", ipa: "[tsʰ]", example: "茶 (caa4 - tea)", soundLike: "aspirated 'ch' as in 'cheese'" },
    { char: "s", ipa: "[s]", example: "三 (saam1 - three)", soundLike: "'s' as in 'sun'" },
    { char: "j", ipa: "[j]", example: "日 (jat6 - sun/day)", soundLike: "'y' as in 'yes' (LSHK uses 'j')" }
  ],

  // Finals (韻母)
  finals: [
    { sound: "aa", example: "花 (faa1 - flower)", desc: "Long open 'ah' sound" },
    { sound: "aai", example: "快 (faai3 - fast)", desc: "'Eye' / 'sigh'" },
    { sound: "aau", example: "包 (baau1 - bun)", desc: "'Ow' as in 'cow'" },
    { sound: "aam", example: "三 (saam1 - three)", desc: "'Ahm' sound" },
    { sound: "aan", example: "山 (saan1 - mountain)", desc: "'Ahn' sound" },
    { sound: "aang", example: "冷 (laang5 - cold)", desc: "'Ahng' sound" },
    { sound: "aap", example: "鴨 (aap3 - duck)", desc: "Checked short 'ahp'" },
    { sound: "aat", example: "八 (baat3 - eight)", desc: "Checked short 'aht'" },
    { sound: "aak", example: "百 (baat3 - hundred)", desc: "Checked short 'ahk'" },
    { sound: "o", example: "波 (bo1 - ball)", desc: "'Aw' as in 'law'" },
    { sound: "oi", example: "愛 (oi3 - love)", desc: "'Oy' as in 'boy'" },
    { sound: "ou", example: "好 (hou2 - good)", desc: "'Oh' as in 'go'" },
    { sound: "uk", example: "屋 (uk1 - house)", desc: "Short 'ook' sound" },
    { sound: "oe", example: "靴 (hoe1 - boots)", desc: "Rounded mid vowel (German ö)" },
    { sound: "yu", example: "書 (syu1 - book)", desc: "Rounded 'ee' sound (German ü)" }
  ],

  // Essential Phrases
  phrases: [
    {
      id: "phr-1",
      chinese: "早晨",
      jyutping: "zou2 san4",
      english: "Good morning",
      notes: "The most iconic morning greeting in Hong Kong, heard everywhere on street corners and in offices.",
      category: "greetings"
    },
    {
      id: "phr-2",
      chinese: "你好",
      jyutping: "nei5 hou2",
      english: "Hello",
      notes: "Standard polite greeting. Casual friends often just say '哈囉' (haa1 lo3) or '喂' (wai2).",
      category: "greetings"
    },
    {
      id: "phr-3",
      chinese: "再見",
      jyutping: "zoi3 gin3",
      english: "Goodbye (formal)",
      notes: "More formal. In daily life, virtually everyone says '拜拜' (baai1 baai3).",
      category: "greetings"
    },
    {
      id: "phr-4",
      chinese: "拜拜",
      jyutping: "baai1 baai3",
      english: "Bye-bye (casual)",
      notes: "Universal everyday departure in Hong Kong.",
      category: "greetings"
    },
    {
      id: "phr-5",
      chinese: "唔該",
      jyutping: "m4 goi1",
      english: "Thank you (for service) / Please / Excuse me",
      notes: "CRUCIAL: Used when someone helps you, opens a door, pours tea, or to get attention.",
      category: "polite"
    },
    {
      id: "phr-6",
      chinese: "多謝",
      jyutping: "do1 ze6",
      english: "Thank you (for gifts / compliments / money)",
      notes: "CRUCIAL: Used for presents, compliments, red packets (利是), or hospitality. Not for simple service.",
      category: "polite"
    },
    {
      id: "phr-7",
      chinese: "唔好意思",
      jyutping: "m4 hou2 ji3 si1",
      english: "Excuse me / Sorry (mild)",
      notes: "Polite softener when squeezing through crowds on the MTR or asking a small favor.",
      category: "polite"
    },
    {
      id: "phr-8",
      chinese: "對唔住",
      jyutping: "deoi3 m4 zyu6",
      english: "Sorry (serious apology)",
      notes: "Reserved for genuine mistakes or causing someone harm.",
      category: "polite"
    },
    {
      id: "phr-9",
      chinese: "係",
      jyutping: "hai6",
      english: "Yes / To be (is/am/are)",
      notes: "Affirms identity or state. Cantonese answers questions by echoing the verb.",
      category: "yesno"
    },
    {
      id: "phr-10",
      chinese: "唔係",
      jyutping: "m4 hai6",
      english: "No / Not to be",
      notes: "Negative answer to a 'hai6' question.",
      category: "yesno"
    },
    {
      id: "phr-11",
      chinese: "有",
      jyutping: "jau5",
      english: "Yes (I have / There is)",
      notes: "Affirmative answer to questions asking whether something exists or is possessed.",
      category: "yesno"
    },
    {
      id: "phr-12",
      chinese: "冇",
      jyutping: "mou5",
      english: "No (Don't have / There isn't)",
      notes: "Negative answer to 'jau5'. Extremely frequent.",
      category: "yesno"
    },
    {
      id: "phr-13",
      chinese: "得",
      jyutping: "dak1",
      english: "Can do / Alright / Okay",
      notes: "Signifies consent or capability. '得唔得呀?' -> '得!'",
      category: "yesno"
    },
    {
      id: "phr-14",
      chinese: "唔得",
      jyutping: "m4 dak1",
      english: "Cannot / Not okay",
      notes: "Indicates something is not allowed or impossible.",
      category: "yesno"
    },
    {
      id: "phr-15",
      chinese: "我叫...",
      jyutping: "ngo5 giu3...",
      english: "My name is...",
      notes: "e.g. 我叫阿明 (ngo5 giu3 aa3 ming4) = My name is Ming.",
      category: "intro"
    },
    {
      id: "phr-16",
      chinese: "你貴姓呀？",
      jyutping: "nei5 gwai3 seng3 aa3?",
      english: "What is your honorable surname?",
      notes: "Polite formal way to ask someone's surname in business or first meetings.",
      category: "intro"
    },
    {
      id: "phr-17",
      chinese: "好高興識到你",
      jyutping: "hou2 gou1 hing3 sik1 dou3 nei5",
      english: "Nice to meet you",
      notes: "Literally: very happy to know you.",
      category: "intro"
    }
  ],

  // Numbers & Time & Money
  numbersTime: [
    { chinese: "零", jyutping: "ling4", english: "Zero", category: "numbers" },
    { chinese: "一", jyutping: "jat1", english: "One", category: "numbers" },
    { chinese: "二 / 兩", jyutping: "ji6 / loeng5", english: "Two (counting: ji6; with measure words: loeng5)", category: "numbers" },
    { chinese: "三", jyutping: "saam1", english: "Three", category: "numbers" },
    { chinese: "四", jyutping: "sei3", english: "Four", category: "numbers" },
    { chinese: "五", jyutping: "ng5", english: "Five", category: "numbers" },
    { chinese: "六", jyutping: "luk6", english: "Six", category: "numbers" },
    { chinese: "七", jyutping: "cat1", english: "Seven", category: "numbers" },
    { chinese: "八", jyutping: "baat3", english: "Eight", category: "numbers" },
    { chinese: "九", jyutping: "gau2", english: "Nine", category: "numbers" },
    { chinese: "十", jyutping: "sap6", english: "Ten", category: "numbers" },
    { chinese: "百", jyutping: "baak3", english: "Hundred", category: "numbers" },
    { chinese: "千", jyutping: "cin1", english: "Thousand", category: "numbers" },
    { chinese: "萬", jyutping: "maan6", english: "Ten thousand", category: "numbers" },
    { chinese: "星期一", jyutping: "sing1 kei4 jat1", english: "Monday (or 禮拜一 lai5 baai3 jat1)", category: "days" },
    { chinese: "星期二", jyutping: "sing1 kei4 ji6", english: "Tuesday", category: "days" },
    { chinese: "星期三", jyutping: "sing1 kei4 saam1", english: "Wednesday", category: "days" },
    { chinese: "星期四", jyutping: "sing1 kei4 sei3", english: "Thursday", category: "days" },
    { chinese: "星期五", jyutping: "sing1 kei4 ng5", english: "Friday", category: "days" },
    { chinese: "星期六", jyutping: "sing1 kei4 luk6", english: "Saturday", category: "days" },
    { chinese: "星期日", jyutping: "sing1 kei4 jat6", english: "Sunday (or 星期天)", category: "days" },
    { chinese: "幾點？", jyutping: "gei2 dim2?", english: "What time is it?", category: "time" },
    { chinese: "兩點三個字", jyutping: "loeng5 dim2 saam1 go3 zi6", english: "2:15 (each '字' is 5 minutes on the clock face)", category: "time" },
    { chinese: "半", jyutping: "bun3", english: "Half (e.g. 三點半 saam1 dim2 bun3 = 3:30)", category: "time" },
    { chinese: "蚊", jyutping: "man1", english: "Buck / Dollar (HK colloquial for 元 jyun4)", category: "money" },
    { chinese: "毫子", jyutping: "hou4 zi2", english: "10-cent coin / cents (dimes)", category: "money" },
    { chinese: "幾多錢？", jyutping: "gei2 do1 cin2?", english: "How much is it?", category: "money" },
    { chinese: "廿蚊", jyutping: "jaa6 man1", english: "Twenty dollars ($20)", category: "money" },
    { chinese: "找錢", jyutping: "zaau2 cin2", english: "Give change", category: "money" }
  ],

  // Food & Daily Life
  dailyLife: [
    {
      chinese: "凍檸茶",
      jyutping: "dung3 ning9 caa4",
      english: "Iced Lemon Tea",
      context: "The holy grail of Hong Kong cha chaan teng drinks. Fresh lemon slices pounded with black tea.",
      category: "food"
    },
    {
      chinese: "少甜",
      jyutping: "siu2 tim4",
      english: "Less sweet (less sugar syrup)",
      context: "Essential customization when ordering drinks.",
      category: "food"
    },
    {
      chinese: "走冰",
      jyutping: "zau2 bing1",
      english: "No ice",
      context: "'走' means remove/omit. Also: 走糖 (zau2 tong4 - no sugar), 走蔥 (zau2 cung1 - no green onions).",
      category: "food"
    },
    {
      chinese: "絲襪奶茶",
      jyutping: "si1 mat6 naai5 caa4",
      english: "Silk Stocking Milk Tea",
      context: "Rich Hong Kong style milk tea brewed through a fine sackcloth filter with evaporated milk.",
      category: "food"
    },
    {
      chinese: "菠蘿油",
      jyutping: "bo1 lo4 jau4",
      english: "Pineapple Bun with Butter",
      context: "Warm sweet crusted bun stuffed with a thick slab of chilled butter.",
      category: "food"
    },
    {
      chinese: "蛋撻",
      jyutping: "daan6 taat1",
      english: "Egg Tart",
      context: "Flaky puff pastry or shortcrust filled with warm egg custard.",
      category: "food"
    },
    {
      chinese: "出前一丁",
      jyutping: "ceot1 cin4 jat1 ding1",
      english: "Demae Iccho instant noodles",
      context: "HK comfort food breakfast served with luncheon meat (餐肉) and fried egg (煎蛋).",
      category: "food"
    },
    {
      chinese: "乾炒牛河",
      jyutping: "gon1 caau2 ngau4 ho2",
      english: "Stir-fried Beef Flat Rice Noodles",
      context: "The true test of a Cantonese chef's wok hei (鑊氣).",
      category: "food"
    },
    {
      chinese: "埋單",
      jyutping: "maai4 daan1",
      english: "Bill please!",
      context: "Shout this or gesture with a pen-writing motion to request the bill.",
      category: "food"
    },
    {
      chinese: "呢度",
      jyutping: "ni1 dou6",
      english: "Here",
      context: "Location: e.g. 喺呢度 (hai2 ni1 dou6 - right here).",
      category: "directions"
    },
    {
      chinese: "嗰度",
      jyutping: "go2 dou6",
      english: "There / Over there",
      context: "Pointing to a farther distance.",
      category: "directions"
    },
    {
      chinese: "直行",
      jyutping: "zik6 haang4",
      english: "Go straight",
      context: "Direction guidance.",
      category: "directions"
    },
    {
      chinese: "轉左 / 轉右",
      jyutping: "zyun3 zo2 / zyun3 jau6",
      english: "Turn left / Turn right",
      context: "Navigating taxis and street directions.",
      category: "directions"
    },
    {
      chinese: "平啲啦！",
      jyutping: "peng4 di1 laa1!",
      english: "Make it cheaper, please!",
      context: "Bargaining at markets like Ladies' Market or Temple Street.",
      category: "shopping"
    },
    {
      chinese: "地鐵 / 港鐵",
      jyutping: "dei6 tit3 / gong2 tit3",
      english: "MTR (Hong Kong subway)",
      context: "The fastest way around town.",
      category: "transport"
    },
    {
      chinese: "巴士",
      jyutping: "baa1 si2",
      english: "Bus",
      context: "Double-decker buses across Kowloon and HK Island.",
      category: "transport"
    },
    {
      chinese: "的士",
      jyutping: "dik1 si2",
      english: "Taxi",
      context: "Red for urban, Green for New Territories, Blue for Lantau.",
      category: "transport"
    },
    {
      chinese: "小巴",
      jyutping: "siu2 baa1",
      english: "Minibus (16-19 seater van)",
      context: "Green or Red minibuses.",
      category: "transport"
    },
    {
      chinese: "有落！",
      jyutping: "jau5 lok6!",
      english: "Getting off! / Stop here!",
      context: "MINIBUS ESSENTIAL: Minibuses have no stop buttons! You must shout this loudly at the driver before your stop, e.g. '燈位有落!' (Stop at the traffic light!).",
      category: "transport"
    }
  ],

  // Grammar: Particles, Negation, Measure Words
  grammarParticles: [
    {
      particle: "啦",
      jyutping: "laa1 / laa3",
      function: "Suggestion, Urgency, or Completed State",
      explanation: "Softens suggestions ('走啦 zau2 laa1' - let's go), expresses eagerness, or marks that something is already done ('搞掂啦 gaau2 dim2 laa3' - it's settled now!).",
      example: "我哋去食飯啦！ (ngo5 dei6 heoi3 sik6 faan6 laa1!) - Let's go eat!"
    },
    {
      particle: "喎",
      jyutping: "wo3 / wo5",
      function: "Reported Speech / Hearsay / Gentle Reminder",
      explanation: "Quotes another person or signals surprise: '佢話聽日唔返喎' (He said he's not coming in tomorrow). Can also gently remind someone.",
      example: "落雨喎，帶遮啦！ (lok6 jyu5 wo3, daai3 ze1 laa1!) - It's raining, you know, bring an umbrella!"
    },
    {
      particle: "啊",
      jyutping: "aa3",
      function: "Warmth, Softener, Casual Connection",
      explanation: "The default conversational softener. Without it, Cantonese can sound blunt or cold.",
      example: "係啊！ (hai6 aa3!) - Yeah, exactly!"
    },
    {
      particle: "嘅",
      jyutping: "ge3",
      function: "Possessive ('s) or Emphatic Assertion",
      explanation: "1) Works like English 's: '我嘅書' (my book). 2) At sentence end, emphasizes certainty or explanation: '我知嘅' (I do know).",
      example: "呢個係我嘅朋友。 (ni1 go3 hai6 ngo5 ge3 pang4 jau5.) - This is my friend."
    },
    {
      particle: "咩",
      jyutping: "me1",
      function: "Skepticism / Rhetorical Incredulity",
      explanation: "Turns a statement into a doubtful question, indicating you don't really believe it or are shocked: 'Really?! Are you sure?!'",
      example: "你唔知咩？ (nei5 m4 zi1 me1?) - You didn't know?! (I thought you did!)"
    },
    {
      particle: "呀",
      jyutping: "aa4",
      function: "Neutral Question Marker",
      explanation: "Changes a statement into a gentle yes/no or clarification question.",
      example: "你係香港人呀？ (nei5 hai6 hoeng1 gong2 jan4 aa4?) - Are you a Hongkonger?"
    }
  ],

  grammarMeasureWords: [
    { char: "個", jyutping: "go3", usedFor: "General objects, people, concepts", example: "一個人 (jat1 go3 jan4 - one person)" },
    { char: "條", jyutping: "tiu4", usedFor: "Long, thin, flexible things (roads, fish, trousers)", example: "一條魚 (jat1 tiu4 jyu2 - one fish)" },
    { char: "隻", jyutping: "zek3", usedFor: "Animals, single items of pairs (hands, shoes), boats", example: "一隻貓 (jat1 zek3 maau1 - one cat)" },
    { char: "杯", jyutping: "bui1", usedFor: "Cups, glasses of beverages", example: "兩杯奶茶 (loeng5 bui1 naai5 caa4 - two cups of milk tea)" },
    { char: "碗", jyutping: "wun2", usedFor: "Bowls of soup, noodles, rice", example: "一碗雲吞麵 (jat1 wun2 wan4 tan1 min6 - a bowl of wonton noodles)" },
    { char: "件", jyutping: "gin6", usedFor: "Pieces of clothing, luggage, events", example: "一件衫 (jat1 gin6 saam1 - a piece of clothing)" },
    { char: "支", jyutping: "zi1", usedFor: "Stick-like, rigid objects, pens, bottled drinks", example: "一支筆 (jat1 zi1 bat1 - a pen)" },
    { char: "間", jyutping: "gaan1", usedFor: "Buildings, shops, rooms, schools", example: "一間餐廳 (jat1 gaan1 caan1 teng1 - a restaurant)" }
  ],

  grammarNegation: [
    {
      word: "唔",
      jyutping: "m4",
      type: "General Negation",
      usage: "Negates adjectives, future intentions, habitual actions, and the verb 'to be' (係). Equivalent to Mandarin 不 (bù).",
      examples: [
        "唔食 (m4 sik6) - I don't eat / won't eat",
        "唔好 (m4 hou2) - Not good / bad",
        "唔係 (m4 hai6) - Is not"
      ]
    },
    {
      word: "冇",
      jyutping: "mou5",
      type: "Lack of Possession / Incompletion",
      usage: "Negates possession ('do not have') and past completed actions ('did not do'). Equivalent to Mandarin 沒 (méi).",
      examples: [
        "冇錢 (mou5 cin2) - Have no money",
        "冇去 (mou5 heoi3) - Didn't go",
        "冇問題 (mou5 man6 tai4) - No problem"
      ]
    },
    {
      word: "咪",
      jyutping: "mai5",
      type: "Imperative Prohibition",
      usage: "Tells someone NOT to do something. Equivalent to 'don't!' (Mandarin 別 bié).",
      examples: [
        "咪郁！ (mai5 juk1!) - Don't move!",
        "咪搞 (mai5 gaau2) - Don't mess with that!"
      ]
    }
  ],

  // Practice characters specifically for Writing Practice (with stroke data in stroke-cache.js)
  practiceCharacters: [
    { char: "好", jyutping: "hou2", meaning: "good / very", pinyin: "hǎo" },
    { char: "正", jyutping: "zeng3", meaning: "awesome / straight", pinyin: "zhèng" },
    { char: "食", jyutping: "sik6", meaning: "to eat / food", pinyin: "shí" },
    { char: "水", jyutping: "seoi2", meaning: "water", pinyin: "shuǐ" },
    { char: "車", jyutping: "ce1", meaning: "car / vehicle", pinyin: "chē" },
    { char: "點", jyutping: "dim2", meaning: "o'clock / point / how", pinyin: "diǎn" },
    { char: "心", jyutping: "sam1", meaning: "heart / mind", pinyin: "xīn" },
    { char: "學", jyutping: "hok6", meaning: "to learn / study", pinyin: "xué" },
    { char: "錢", jyutping: "cin2", meaning: "money", pinyin: "qián" },
    { char: "人", jyutping: "jan4", meaning: "person / human", pinyin: "rén" },
    { char: "茶", jyutping: "caa4", meaning: "tea", pinyin: "chá" },
    { char: "飯", jyutping: "faan6", meaning: "cooked rice / meal", pinyin: "fàn" },
    { char: "日", jyutping: "jat6", meaning: "day / sun", pinyin: "rì" },
    { char: "月", jyutping: "jyut6", meaning: "month / moon", pinyin: "yuè" },
    { char: "年", jyutping: "nin4", meaning: "year", pinyin: "nián" },
    { char: "大", jyutping: "daai6", meaning: "big", pinyin: "dà" },
    { char: "細", jyutping: "sai3", meaning: "small / fine", pinyin: "xì" },
    { char: "買", jyutping: "maai5", meaning: "to buy", pinyin: "mǎi" },
    { char: "東", jyutping: "dung1", meaning: "east", pinyin: "dōng" },
    { char: "西", jyutping: "sai1", meaning: "west / things (東西)", pinyin: "xī" },
    { char: "唔", jyutping: "m4", meaning: "not / negative marker", isDialect: true },
    { char: "冇", jyutping: "mou5", meaning: "not have / there isn't", isDialect: true },
    { char: "嘅", jyutping: "ge3", meaning: "possessive ('s) / assertive particle", isDialect: true },
    { char: "咗", jyutping: "zo2", meaning: "perfective aspect (completed action)", isDialect: true }
  ]
};

/**
 * Accessor & Helper Functions for Leveled Vocabulary & Skill Path
 */
(function() {
  // Aggregate all loaded level arrays into CANTONESE_DATA.leveledVocab
  window.CANTONESE_DATA.getLeveledVocab = function() {
    const l1 = window.CANTONESE_LEVEL_1 || [];
    const l2 = window.CANTONESE_LEVEL_2 || [];
    const l3 = window.CANTONESE_LEVEL_3 || [];
    const l4 = window.CANTONESE_LEVEL_4 || [];
    const l5 = window.CANTONESE_LEVEL_5 || [];
    const l6 = (window.CANTONESE_LEVEL_6 || []).concat(window.CANTONESE_MANUAL_SLANG || []);

    return { 1: l1, 2: l2, 3: l3, 4: l4, 5: l5, 6: l6 };
  };

  window.CANTONESE_DATA.getAllWords = function() {
    const lvl = window.CANTONESE_DATA.getLeveledVocab();
    return [
      ...lvl[1],
      ...lvl[2],
      ...lvl[3],
      ...lvl[4],
      ...lvl[5],
      ...lvl[6]
    ];
  };

  // Find word by ID or Hanzi
  window.CANTONESE_DATA.findWord = function(query) {
    const all = window.CANTONESE_DATA.getAllWords();
    return all.find(w => w.id === query || w.hanzi === query);
  };

  // Slang accessor for the highlighted slang section
  window.CANTONESE_DATA.getSlangList = function() {
    const lvl = window.CANTONESE_DATA.getLeveledVocab();
    return lvl[6] || [];
  };

  // Generate skill path curriculum units from levels and topics
  window.CANTONESE_DATA.getSkillUnits = function() {
    const lvls = window.CANTONESE_DATA.getLeveledVocab();
    
    return [
      {
        id: "unit-1",
        level: 1,
        title: "Unit 1: Beginner Essentials",
        subtitle: "Greetings, Numbers, Pronouns & Verbs",
        icon: "👋",
        color: "#0071e3",
        topics: ["greetings", "numbers", "basic_verbs", "pronouns_particles"],
        words: lvls[1].filter(w => ['greetings', 'numbers', 'basic_verbs', 'pronouns_particles'].includes(w.topic))
      },
      {
        id: "unit-2",
        level: 1,
        title: "Unit 2: Daily Nourishment & Family",
        subtitle: "Family, Food & Days of the Week",
        icon: "🥢",
        color: "#34c759",
        topics: ["family", "food", "colors", "days"],
        words: lvls[1].filter(w => ['family', 'food', 'colors', 'days'].includes(w.topic))
      },
      {
        id: "unit-3",
        level: 2,
        title: "Unit 3: Navigating Hong Kong",
        subtitle: "Transport, Directions, Shopping & Money",
        icon: "🚇",
        color: "#ff9500",
        topics: ["transport", "shopping"],
        words: lvls[2].filter(w => ['transport', 'shopping'].includes(w.topic))
      },
      {
        id: "unit-4",
        level: 2,
        title: "Unit 4: Body, Mind & Sky",
        subtitle: "Weather, Human Body & Expressing Feelings",
        icon: "☀️",
        color: "#af52de",
        topics: ["weather", "body", "feelings", "daily"],
        words: lvls[2].filter(w => ['weather', 'body', 'feelings', 'daily'].includes(w.topic))
      },
      {
        id: "unit-5",
        level: 3,
        title: "Unit 5: Office, School & Leisure",
        subtitle: "Work, Studies, Hobbies & Entertainment",
        icon: "💼",
        color: "#0071e3",
        topics: ["work", "school", "hobbies"],
        words: lvls[3].filter(w => ['work', 'school', 'hobbies'].includes(w.topic))
      },
      {
        id: "unit-6",
        level: 3,
        title: "Unit 6: Travel, Wellness & Debate",
        subtitle: "Vacations, Health, Opinions & Connectors",
        icon: "✈️",
        color: "#5856d6",
        topics: ["travel", "health"],
        words: lvls[3].filter(w => ['travel', 'health'].includes(w.topic))
      },
      {
        id: "unit-7",
        level: 4,
        title: "Unit 7: Contemporary Society",
        subtitle: "Technology, City News & Human Relationships",
        icon: "📱",
        color: "#ff2d55",
        topics: ["daily", "work"],
        words: lvls[4]
      },
      {
        id: "unit-8",
        level: 5,
        title: "Unit 8: Advanced Idioms & Culture",
        subtitle: "Traditional 成語, Formal Register & Heritage",
        icon: "📜",
        color: "#c69214",
        topics: ["idioms"],
        words: lvls[5]
      },
      {
        id: "unit-9",
        level: 6,
        title: "Unit 9: Pro Street Talk & Slang",
        subtitle: "Heavy Slang, Gen-Z Terms, 歇後語 & 18+",
        icon: "🔥",
        color: "#ff3b30",
        topics: ["slang"],
        words: lvls[6]
      }
    ];
  };

})();
