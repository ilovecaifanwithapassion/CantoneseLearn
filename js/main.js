/**
 * CantoneseLearn Pro - Main Application Controller
 * Handles Apple-aesthetic UI, Leveled Vocab Library, Duolingo-style Skill Tree,
 * 8 Interactive Exercise Types, Web Audio SFX, Spaced Repetition (Leitner 4-box),
 * HanziWriter Stroke Trainer, Free Draw Canvas, and Real XP Progression System.
 */

(function () {
  'use strict';

  // --- 1. Persistent State & Storage ---
  const STORAGE_KEYS = {
    THEME: 'cantonese_theme',
    PROGRESS: 'cantonese_user_progress',
    SETTINGS: 'cantonese_settings',
    SRS: 'cantonese_srs_data'
  };

  const defaultProgress = {
    learned: [],
    xp: 0,
    hearts: 5,
    streak: { count: 1, lastActive: new Date().toISOString().slice(0, 10) },
    unlockedUnit: 1,
    completedLessons: {},
    writingMastered: [],
    weeklyXp: { [new Date().toISOString().slice(0, 10)]: 0 }
  };

  const defaultSettings = {
    includeUnverifiedInLearn: false,
    soundMuted: false
  };

  function migrateProgress(raw) {
    if (!raw || typeof raw !== 'object') return { ...defaultProgress };
    return {
      learned: Array.isArray(raw.learned) ? raw.learned : [],
      xp: typeof raw.xp === 'number' ? raw.xp : (parseInt(raw.xp, 10) || 0),
      hearts: typeof raw.hearts === 'number' ? Math.max(0, raw.hearts) : 5,
      streak: (raw.streak && typeof raw.streak.count === 'number')
        ? raw.streak
        : { count: 1, lastActive: new Date().toISOString().slice(0, 10) },
      unlockedUnit: typeof raw.unlockedUnit === 'number' ? Math.max(1, raw.unlockedUnit) : 1,
      completedLessons: (raw.completedLessons && typeof raw.completedLessons === 'object') ? raw.completedLessons : {},
      writingMastered: Array.isArray(raw.writingMastered) ? raw.writingMastered : [],
      weeklyXp: (raw.weeklyXp && typeof raw.weeklyXp === 'object')
        ? raw.weeklyXp
        : { [new Date().toISOString().slice(0, 10)]: 0 }
    };
  }

  function loadStorage(key, defaultVal) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultVal;
      const parsed = JSON.parse(data);
      if (key === STORAGE_KEYS.PROGRESS) return migrateProgress(parsed);
      return parsed;
    } catch (e) {
      console.warn('Storage parse fallback for', key, e);
      return defaultVal;
    }
  }

  function saveStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage save error for', key, e);
    }
  }

  // --- XP Level Formula ---
  // Level N requires N * 100 XP to advance to Level N+1
  function getXpLevelInfo(totalXp) {
    totalXp = Math.max(0, parseInt(totalXp, 10) || 0);
    let level = 1;
    let needed = 100;
    let currentThreshold = 0;

    while (totalXp >= currentThreshold + needed) {
      currentThreshold += needed;
      level++;
      needed = level * 100;
    }

    const xpInLevel = totalXp - currentThreshold;
    const xpToNext = needed - xpInLevel;
    const progressPct = Math.min(100, Math.round((xpInLevel / needed) * 100));

    return { level, xpInLevel, needed, xpToNext, progressPct };
  }

  const appState = {
    progress: loadStorage(STORAGE_KEYS.PROGRESS, defaultProgress),
    settings: loadStorage(STORAGE_KEYS.SETTINGS, defaultSettings),
    srs: loadStorage(STORAGE_KEYS.SRS, {}),

    // Vocab Library Filter State
    vocabFilter: {
      level: 'all',
      topic: 'all',
      tag: 'all',
      search: '',
      sort: 'freq',
      page: 1,
      pageSize: 36
    },

    // Duolingo Runner State
    runner: {
      active: false,
      unit: null,
      lessonIndex: 0,
      queue: [],
      currentIndex: 0,
      totalExercises: 0,
      mistakesCount: 0,
      correctCount: 0,
      answered: false,
      selectedChoice: null,
      wordBankTarget: [],
      wordBankPool: [],
      matchSelectedLeft: null,
      matchSelectedRight: null,
      matchedPairsCount: 0,
      isReviewMode: false,
      isTestOut: false
    },

    // Writing Studio State
    strokeCharIndex: 0,
    freeDrawGuide: true,
    canvasHistory: [],
    currentTypingIndex: 0,

    audioCtx: null,
    hkVoice: null
  };

  // Streak verification
  (function verifyStreak() {
    const today = new Date().toISOString().slice(0, 10);
    if (!appState.progress.streak) {
      appState.progress.streak = { count: 1, lastActive: today };
    } else {
      const last = new Date(appState.progress.streak.lastActive);
      const now = new Date(today);
      const diff = Math.round((now - last) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        appState.progress.streak.count++;
        appState.progress.streak.lastActive = today;
      } else if (diff > 1) {
        appState.progress.streak.count = 1;
        appState.progress.streak.lastActive = today;
      }
    }
    if (!appState.progress.weeklyXp) appState.progress.weeklyXp = {};
    if (!appState.progress.weeklyXp[today]) appState.progress.weeklyXp[today] = 0;
    saveProgress();
  })();

  function saveProgress() {
    saveStorage(STORAGE_KEYS.PROGRESS, appState.progress);
    updateDashboardStats();
  }

  // --- 2. Theme & Glass Navbar ---
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(initial);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme') || 'light';
        const next = curr === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE_KEYS.THEME, next);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const sun = document.getElementById('theme-icon-sun');
    const moon = document.getElementById('theme-icon-moon');
    if (sun && moon) {
      sun.style.display = theme === 'dark' ? 'block' : 'none';
      moon.style.display = theme === 'dark' ? 'none' : 'block';
    }
    if (typeof drawTianGrid === 'function') drawTianGrid();
  }

  // --- 3. Web Speech API & Tone Pitch Contour Synthesizer ---
  function initSpeech() {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        const vList = window.speechSynthesis.getVoices();
        appState.hkVoice = vList.find(v =>
          v.lang === 'zh-HK' || v.lang === 'yue-HK' ||
          v.name.toLowerCase().includes('hong kong') ||
          v.name.toLowerCase().includes('cantonese') ||
          v.name.toLowerCase().includes('sin-ji')
        ) || null;
      };
      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  window.speakText = function (text, rate = 0.88) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-HK';
      u.rate = rate;
      if (appState.hkVoice) u.voice = appState.hkVoice;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  };

  // Web Audio Context Synthesizer (Pitch contour & Sound FX)
  function getAudioContext() {
    if (!appState.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) appState.audioCtx = new AudioContextClass();
    }
    if (appState.audioCtx && appState.audioCtx.state === 'suspended') {
      appState.audioCtx.resume();
    }
    return appState.audioCtx;
  }

  function playToneContour(startHz, endHz, durationSec = 0.55) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startHz, now);
    if (startHz !== endHz) osc.frequency.exponentialRampToValueAtTime(Math.max(endHz, 20), now + durationSec);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec);
  }

  function playSoundFX(type) {
    if (appState.settings.soundMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'correct') {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const noteStart = now + idx * 0.08;
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.22, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.25);
      });
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(174, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.25);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'complete') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const noteStart = now + idx * 0.12;
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.28, noteStart + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.42);
      });
    } else if (type === 'levelup') {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const noteStart = now + idx * 0.14;
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.3, noteStart + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.5);
      });
    }
  }

  function showToast(msg, icon = '✓') {
    const box = document.getElementById('toast-container');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
    box.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
      t.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      setTimeout(() => t.remove(), 320);
    }, 2800);
  }

  // --- 4. Scroll Experience & Active Nav ---
  function initScrollExperience() {
    const bar = document.getElementById('scroll-progress-bar');
    const heroContent = document.getElementById('hero-interactive-content');
    const floatCards = [
      document.getElementById('float-card-1'),
      document.getElementById('float-card-2'),
      document.getElementById('float-card-3'),
      document.getElementById('float-card-4')
    ];

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar && max > 0) bar.style.width = (Math.min(100, Math.max(0, (scrollY / max) * 100))) + '%';

      if (heroContent && scrollY < 650) {
        heroContent.style.transform = `scale(${Math.max(0.88, 1 - scrollY * 0.0003)}) translateY(${scrollY * 0.25}px)`;
        heroContent.style.opacity = Math.max(0, 1 - scrollY * 0.0018);
      }

      if (scrollY < 750) {
        if (floatCards[0]) floatCards[0].style.transform = `rotate(-5deg) translateY(${scrollY * -0.15}px)`;
        if (floatCards[1]) floatCards[1].style.transform = `rotate(6deg) translateY(${scrollY * -0.22}px)`;
        if (floatCards[2]) floatCards[2].style.transform = `rotate(4deg) translateY(${scrollY * -0.12}px)`;
        if (floatCards[3]) floatCards[3].style.transform = `rotate(-6deg) translateY(${scrollY * -0.18}px)`;
      }
    }, { passive: true });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('is-visible');
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.fade-in-section').forEach(s => observer.observe(s));

    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id], header[id]');
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href').replace('#', '') === id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(s => navObs.observe(s));

    const mobileBtn = document.getElementById('mobile-menu-toggle');
    const navLinksList = document.getElementById('nav-links');
    if (mobileBtn && navLinksList) {
      mobileBtn.addEventListener('click', () => navLinksList.classList.toggle('mobile-open'));
      navLinksList.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navLinksList.classList.remove('mobile-open'));
      });
    }
  }

  // --- 5. Dashboard & Live XP Stats Updater ---
  function updateDashboardStats() {
    const totalXp = appState.progress.xp || 0;
    const lvlInfo = getXpLevelInfo(totalXp);
    const today = new Date().toISOString().slice(0, 10);
    const todayXp = (appState.progress.weeklyXp && appState.progress.weeklyXp[today]) || 0;
    const dailyGoal = 50;

    // Nav XP Pill
    const navLvl = document.getElementById('nav-xp-lvl');
    const navFill = document.getElementById('nav-xp-fill');
    const navVal = document.getElementById('nav-xp-val');
    if (navLvl) navLvl.textContent = `Lv.${lvlInfo.level}`;
    if (navFill) navFill.style.width = `${lvlInfo.progressPct}%`;
    if (navVal) navVal.textContent = `${totalXp} XP`;

    // Dashboard XP & Level
    const xpEl = document.getElementById('stat-xp');
    const lvlBadge = document.getElementById('stat-level-badge');
    const xpFill = document.getElementById('stat-xp-fill');
    const xpToNext = document.getElementById('stat-xp-to-next');
    if (xpEl) xpEl.textContent = `${totalXp} XP`;
    if (lvlBadge) lvlBadge.textContent = `Level ${lvlInfo.level}`;
    if (xpFill) xpFill.style.width = `${lvlInfo.progressPct}%`;
    if (xpToNext) xpToNext.textContent = `${lvlInfo.xpToNext} XP to Lv.${lvlInfo.level + 1}`;

    // Daily Goal
    const dailyEl = document.getElementById('stat-daily-goal');
    const dailyFill = document.getElementById('stat-daily-fill');
    if (dailyEl) dailyEl.textContent = `${todayXp} / ${dailyGoal}`;
    if (dailyFill) dailyFill.style.width = `${Math.min(100, Math.round((todayXp / dailyGoal) * 100))}%`;

    // Words Learned & SRS Due
    const learnedEl = document.getElementById('stat-learned-count');
    const dueEl = document.getElementById('stat-srs-due');
    if (learnedEl) learnedEl.textContent = appState.progress.learned.length;

    let dueCount = 0;
    const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    Object.values(appState.srs).forEach(item => {
      const stage = item.stage || 1;
      boxCounts[stage] = (boxCounts[stage] || 0) + 1;
      if (!item.due || item.due <= today) dueCount++;
    });
    if (dueEl) dueEl.textContent = dueCount;
    const srsDueBadge = document.getElementById('srs-due-badge-count');
    if (srsDueBadge) srsDueBadge.textContent = dueCount;

    for (let b = 1; b <= 4; b++) {
      const boxEl = document.getElementById(`srs-box-${b}-count`);
      if (boxEl) boxEl.textContent = boxCounts[b] || 0;
    }

    // Day Streak & Bonus
    const streakEl = document.getElementById('stat-streak-days');
    const streakBonusEl = document.getElementById('stat-streak-bonus');
    const streakCount = appState.progress.streak ? appState.progress.streak.count : 1;
    const streakBonus = Math.min(20, streakCount * 2);
    if (streakEl) streakEl.textContent = `${streakCount} 🔥`;
    if (streakBonusEl) streakBonusEl.textContent = `Day Streak (+${streakBonus} XP)`;

    renderWeeklyActivityChart();
  }

  function renderWeeklyActivityChart() {
    const container = document.getElementById('weekly-activity-chart');
    if (!container) return;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = days[d.getDay()];
      const xp = (appState.progress.weeklyXp && appState.progress.weeklyXp[dateStr]) || 0;
      last7Days.push({ dateStr, dayName, xp });
    }

    const maxXp = Math.max(50, ...last7Days.map(d => d.xp));

    container.innerHTML = last7Days.map(d => {
      const heightPct = Math.min(100, Math.max(8, (d.xp / maxXp) * 100));
      return `
        <div class="day-bar-col" title="${d.dateStr}: ${d.xp} XP">
          <div class="day-bar-fill" style="height: ${heightPct}%;"></div>
          <span class="day-bar-lbl">${d.dayName}</span>
        </div>
      `;
    }).join('');
  }

  // --- 6. Vocab Library Page Engine ---
  function initVocabLibrary() {
    const levelBtns = document.getElementById('vocab-level-buttons');
    const searchInput = document.getElementById('vocab-library-search');
    const topicSelect = document.getElementById('vocab-topic-filter');
    const tagSelect = document.getElementById('vocab-tag-filter');
    const sortSelect = document.getElementById('vocab-sort-by');
    const settingUnverified = document.getElementById('setting-include-unverified');
    const prevBtn = document.getElementById('btn-vocab-prev');
    const nextBtn = document.getElementById('btn-vocab-next');

    if (levelBtns) {
      levelBtns.addEventListener('click', (e) => {
        const btn = e.target.closest('.level-tab-btn');
        if (!btn) return;
        levelBtns.querySelectorAll('.level-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.vocabFilter.level = btn.dataset.level;
        appState.vocabFilter.page = 1;
        renderVocabLibrary();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        appState.vocabFilter.search = e.target.value.trim().toLowerCase();
        appState.vocabFilter.page = 1;
        renderVocabLibrary();
      });
    }

    if (topicSelect) {
      topicSelect.addEventListener('change', (e) => {
        appState.vocabFilter.topic = e.target.value;
        appState.vocabFilter.page = 1;
        renderVocabLibrary();
      });
    }

    if (tagSelect) {
      tagSelect.addEventListener('change', (e) => {
        appState.vocabFilter.tag = e.target.value;
        appState.vocabFilter.page = 1;
        renderVocabLibrary();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        appState.vocabFilter.sort = e.target.value;
        appState.vocabFilter.page = 1;
        renderVocabLibrary();
      });
    }

    if (settingUnverified) {
      settingUnverified.checked = appState.settings.includeUnverifiedInLearn;
      settingUnverified.addEventListener('change', (e) => {
        appState.settings.includeUnverifiedInLearn = e.target.checked;
        saveStorage(STORAGE_KEYS.SETTINGS, appState.settings);
        showToast(e.target.checked ? 'Unverified words included in lessons.' : 'Unverified words excluded from lessons.');
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (appState.vocabFilter.page > 1) {
          appState.vocabFilter.page--;
          renderVocabLibrary();
          document.getElementById('vocab-library').scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        appState.vocabFilter.page++;
        renderVocabLibrary();
        document.getElementById('vocab-library').scrollIntoView({ behavior: 'smooth' });
      });
    }

    renderVocabLibrary();
  }

  function renderVocabLibrary() {
    const container = document.getElementById('vocab-library-grid');
    const summaryText = document.getElementById('vocab-status-summary-text');
    const pageIndicator = document.getElementById('vocab-page-indicator');
    const prevBtn = document.getElementById('btn-vocab-prev');
    const nextBtn = document.getElementById('btn-vocab-next');
    if (!container || !window.CANTONESE_DATA) return;

    const all = window.CANTONESE_DATA.getAllWords();
    const f = appState.vocabFilter;

    // Filter by Level
    let filtered = f.level === 'all' ? all : all.filter(w => String(w.level) === f.level);

    // Filter by Topic
    if (f.topic !== 'all') {
      filtered = filtered.filter(w => w.topic === f.topic);
    }

    // Filter by Tag
    if (f.tag !== 'all') {
      filtered = filtered.filter(w => w.tags && w.tags.includes(f.tag));
    }

    // Search query
    if (f.search) {
      filtered = filtered.filter(w =>
        w.hanzi.includes(f.search) ||
        w.jyutping.toLowerCase().includes(f.search) ||
        (w.english && w.english.toLowerCase().includes(f.search))
      );
    }

    // Sorting
    if (f.sort === 'level') {
      filtered.sort((a, b) => a.level - b.level);
    } else if (f.sort === 'alpha') {
      filtered.sort((a, b) => a.jyutping.localeCompare(b.jyutping));
    }

    // Total stats
    const totalCount = filtered.length;
    const verifiedCount = filtered.filter(w => !w.verify).length;
    const flaggedCount = filtered.filter(w => w.verify).length;

    if (summaryText) {
      summaryText.textContent = `Showing ${totalCount} words (${verifiedCount} Verified · ${flaggedCount} Flagged)`;
    }

    // Pagination
    const totalPages = Math.max(1, Math.ceil(totalCount / f.pageSize));
    f.page = Math.min(Math.max(1, f.page), totalPages);
    if (pageIndicator) pageIndicator.textContent = `Page ${f.page} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = f.page <= 1;
    if (nextBtn) nextBtn.disabled = f.page >= totalPages;

    const startIdx = (f.page - 1) * f.pageSize;
    const pageItems = filtered.slice(startIdx, startIdx + f.pageSize);

    if (pageItems.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-secondary);">
          No vocabulary matched your current search and filter settings.
        </div>
      `;
      return;
    }

    container.innerHTML = pageItems.map(item => {
      const isLearned = appState.progress.learned.includes(item.id);
      const isVulgar = item.tags && item.tags.includes('vulgar');

      return `
        <div class="glass-card vocab-card ${isVulgar ? 'vulgar' : ''}" id="vcard-${item.id}">
          ${isVulgar ? `
            <button class="reveal-overlay-btn" onclick="revealSlang('${item.id}')">
              ⚠️ 18+ Click to Reveal
            </button>
          ` : ''}

          <div class="slang-blur-content">
            <div class="vocab-card-meta">
              <span class="level-tag l${item.level}">L${item.level}</span>
              ${!item.verify
                ? `<span class="badge-verified" title="Cross-checked across dictionary sources">✓ Verified</span>`
                : `<span class="badge-flagged" title="${item.notes || 'Alternative reading recorded'}">Needs checking</span>`
              }
              <span class="badge-tag">${item.topic}</span>
            </div>

            <div class="vocab-top">
              <div>
                <div class="vocab-main">${item.hanzi}</div>
                <div class="vocab-jp">${item.jyutping}</div>
                <div class="vocab-en">${item.english || ''}</div>
              </div>
              <button class="speaker-btn" onclick="speakText('${item.hanzi}')" title="Pronounce">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
            </div>

            ${item.example ? `
              <div class="vocab-notes" style="margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <strong style="color: var(--text-primary); font-size: 0.8rem;">Example:</strong>
                  ${item.example.generated ? `<span class="badge-ai">AI-written</span>` : `<span class="badge-corpus">Spoken corpus</span>`}
                </div>
                <div>${item.example.hanzi}</div>
                <em style="color: var(--accent); font-size: 0.8rem;">${item.example.jyutping}</em><br>
                <span style="color: var(--text-tertiary); font-size: 0.8rem;">"${item.example.english}"</span>
                <button class="speaker-btn" style="padding: 2px; margin-left: 4px;" onclick="speakText('${item.example.hanzi}')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                </button>
              </div>
            ` : ''}

            ${item.notes && item.verify ? `
              <div style="font-size: 0.76rem; color: var(--accent-warning); margin-top: 6px; padding: 4px 8px; background: rgba(255,149,0,0.08); border-radius: var(--radius-sm);">
                <strong>Note:</strong> ${item.notes}
              </div>
            ` : ''}
          </div>

          <div class="vocab-footer" style="margin-top: 10px;">
            <span class="badge-tag" style="font-size: 0.72rem;">${item.pos || 'noun'}</span>
            <button class="learned-toggle ${isLearned ? 'is-learned' : ''}" onclick="toggleLearnedWord('${item.id}', '${item.hanzi}')">
              ${isLearned ? '✓ Learned' : '+ Mark Learned'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- 7. Duolingo-Style Skill Tree Curriculum Engine ---
  function initSkillPath() {
    renderSkillPath();

    const btnPath = document.getElementById('btn-learn-path');
    const btnSrs = document.getElementById('btn-learn-srs');
    const btnWriting = document.getElementById('btn-learn-writing');

    const viewPath = document.getElementById('view-skill-path');
    const viewSrs = document.getElementById('view-srs-dashboard');
    const viewWriting = document.getElementById('view-writing-studio');

    function switchLearnSubView(view) {
      if (btnPath) btnPath.classList.toggle('active', view === 'path');
      if (btnSrs) btnSrs.classList.toggle('active', view === 'srs');
      if (btnWriting) btnWriting.classList.toggle('active', view === 'writing');

      if (viewPath) viewPath.style.display = view === 'path' ? 'block' : 'none';
      if (viewSrs) viewSrs.style.display = view === 'srs' ? 'block' : 'none';
      if (viewWriting) viewWriting.style.display = view === 'writing' ? 'block' : 'none';

      if (view === 'srs') updateDashboardStats();
    }

    if (btnPath) btnPath.addEventListener('click', () => switchLearnSubView('path'));
    if (btnSrs) btnSrs.addEventListener('click', () => switchLearnSubView('srs'));
    if (btnWriting) btnWriting.addEventListener('click', () => switchLearnSubView('writing'));

    const srsReviewBtn = document.getElementById('btn-start-srs-review');
    if (srsReviewBtn) {
      srsReviewBtn.addEventListener('click', startSrsReviewSession);
    }
  }

  function renderSkillPath() {
    const container = document.getElementById('duo-units-container');
    if (!container || !window.CANTONESE_DATA.getSkillUnits) return;

    const units = window.CANTONESE_DATA.getSkillUnits();
    const completed = appState.progress.completedLessons || {};
    const unlockedU = appState.progress.unlockedUnit || 1;

    container.innerHTML = units.map((u, uIdx) => {
      const uNum = uIdx + 1;
      const isUnlocked = uNum <= unlockedU;
      const lessonsPerUnit = 4;
      const positions = ['pos-center', 'pos-left', 'pos-center', 'pos-right'];

      let nodesHtml = '';
      for (let l = 1; l <= lessonsPerUnit; l++) {
        const lessonKey = `${u.id}-l${l}`;
        const isDone = !!completed[lessonKey];
        const isCurrent = isUnlocked && !isDone && (l === 1 || !!completed[`${u.id}-l${l - 1}`]);
        const isLocked = !isUnlocked || (!isDone && !isCurrent);
        const posClass = positions[(l - 1) % positions.length];

        let stateClass = 'locked';
        let icon = '🔒';
        if (isDone) {
          stateClass = 'completed';
          icon = '★';
        } else if (isCurrent) {
          stateClass = 'current';
          icon = '▶';
        }

        nodesHtml += `
          <div class="duo-path-node-row ${posClass}">
            <button class="duo-node-btn ${stateClass}" id="node-${lessonKey}" onclick="handleNodeClick('${u.id}', ${l}, ${isLocked})" title="Lesson ${l}">
              ${isCurrent ? `<div class="duo-node-tooltip">START</div>` : ''}
              <span>${icon}</span>
            </button>
          </div>
        `;
      }

      return `
        <div class="duo-unit-card" id="unit-card-${u.id}">
          <div class="duo-unit-header">
            <div class="duo-unit-header-title">
              <span class="unit-icon">${u.icon}</span>
              <div>
                <h3>${u.title}</h3>
                <p>${u.subtitle}</p>
              </div>
            </div>
            <div class="duo-unit-actions">
              <button class="btn btn-secondary" onclick="testOutUnit('${u.id}', ${uNum})" style="padding: 6px 14px; font-size: 0.85rem;" ${!isUnlocked ? 'disabled' : ''}>
                ⚡ Test Out
              </button>
              <button class="btn btn-secondary" onclick="practiceWeakWords('${u.id}')" style="padding: 6px 14px; font-size: 0.85rem;">
                🎯 Weak Words
              </button>
            </div>
          </div>

          <div class="duo-path-wrapper">
            ${nodesHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  function scrollToCurrentNode() {
    setTimeout(() => {
      const curr = document.querySelector('.duo-node-btn.current');
      if (curr) {
        curr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }

  window.handleNodeClick = function (unitId, lessonIndex, isLocked) {
    if (isLocked) {
      showToast('Complete the previous lessons to unlock this node!', '🔒');
      return;
    }
    startLessonSession(unitId, lessonIndex, false);
  };

  window.testOutUnit = function (unitId, unitNum) {
    if (confirm(`Test out of Unit ${unitNum}? Score 80%+ to unlock the next unit instantly!`)) {
      startLessonSession(unitId, 1, true);
    }
  };

  window.practiceWeakWords = function (unitId) {
    const units = window.CANTONESE_DATA.getSkillUnits();
    const u = units.find(x => x.id === unitId) || units[0];
    const weakPool = u.words.filter(w => {
      const s = appState.srs[w.id];
      return !s || s.stage <= 2;
    });
    const pool = weakPool.length >= 6 ? weakPool : u.words;
    launchRunnerWithWords(pool.slice(0, 8), u, 0, false, true);
  };

  function startSrsReviewSession() {
    const today = new Date().toISOString().slice(0, 10);
    const all = window.CANTONESE_DATA.getAllWords();
    const dueWords = all.filter(w => {
      const s = appState.srs[w.id];
      return s && (!s.due || s.due <= today);
    });

    if (dueWords.length === 0) {
      showToast('No words due for review today! Great job staying ahead.', '🎉');
      return;
    }
    launchRunnerWithWords(dueWords.slice(0, 10), { title: 'Spaced Repetition Review', id: 'srs-review' }, 0, false, false);
  }

  function startLessonSession(unitId, lessonIndex, isTestOut = false) {
    const units = window.CANTONESE_DATA.getSkillUnits();
    const u = units.find(x => x.id === unitId) || units[0];

    // Filter words for this lesson
    let wordPool = u.words;
    if (!appState.settings.includeUnverifiedInLearn) {
      wordPool = wordPool.filter(w => !w.verify);
    }
    if (wordPool.length < 6) wordPool = u.words; // fallback if filtered is too small
    if (wordPool.length === 0) wordPool = window.CANTONESE_DATA.getAllWords().slice(0, 10);

    // Slice ~6-8 words based on lessonIndex
    const start = Math.max(0, ((lessonIndex - 1) * 6) % wordPool.length);
    let lessonWords = wordPool.slice(start, start + 7);
    if (lessonWords.length < 6) {
      const remaining = wordPool.filter(w => !lessonWords.some(lw => lw.id === w.id));
      lessonWords = lessonWords.concat(remaining.slice(0, 6 - lessonWords.length));
    }

    launchRunnerWithWords(lessonWords, u, lessonIndex, isTestOut, false);
  }

  // --- 8. Duolingo Lesson Exercise Runner ---
  function launchRunnerWithWords(words, unit, lessonIndex, isTestOut = false, isWeakPractice = false) {
    appState.runner.active = true;
    appState.runner.unit = unit;
    appState.runner.lessonIndex = lessonIndex;
    appState.runner.isTestOut = isTestOut;
    appState.runner.isWeakPractice = isWeakPractice;
    appState.runner.words = words;
    appState.runner.mistakesCount = 0;
    appState.runner.correctCount = 0;
    appState.progress.hearts = 5;

    // Build mixed exercises
    appState.runner.queue = buildExerciseQueue(words);
    appState.runner.totalExercises = appState.runner.queue.length;
    appState.runner.currentIndex = 0;

    const overlay = document.getElementById('duo-runner-overlay');
    const compOverlay = document.getElementById('duo-completion-overlay');
    if (compOverlay) compOverlay.classList.remove('open');
    if (overlay) overlay.classList.add('open');

    renderCurrentExercise();
  }

  function buildExerciseQueue(words) {
    const queue = [];
    const allWords = window.CANTONESE_DATA.getAllWords();

    words.forEach((w) => {
      const distractors = allWords.filter(x => x.id !== w.id && x.english).sort(() => Math.random() - 0.5).slice(0, 3);

      // 1. Multiple Choice (Hanzi -> English)
      const choices = [w, ...distractors].sort(() => Math.random() - 0.5);
      queue.push({
        type: 'multiple_choice',
        word: w,
        prompt: `What does <strong style="color:var(--accent); font-size:1.8rem;">${w.hanzi}</strong> mean?`,
        promptJp: w.jyutping,
        choices: choices.map(c => ({ text: (c.english || '').split(';')[0].trim(), isCorrect: c.id === w.id }))
      });

      // 2. Listen & Choose
      const listenChoices = [w, ...distractors].sort(() => Math.random() - 0.5);
      queue.push({
        type: 'listen_choose',
        word: w,
        prompt: 'Listen and select what you heard:',
        choices: listenChoices.map(c => ({ text: `${c.hanzi} (${c.jyutping})`, isCorrect: c.id === w.id }))
      });

      // 3. Word Bank Sentence Builder
      const cleanHanzi = w.hanzi;
      const chips = cleanHanzi.split('').concat(['好', '我', '佢', '喺', '嘅'].sort(() => Math.random() - 0.5).slice(0, 3));
      chips.sort(() => Math.random() - 0.5);

      queue.push({
        type: 'word_bank',
        word: w,
        prompt: `Translate to Cantonese: "<strong>${(w.english || '').split(';')[0].trim()}</strong>"`,
        targetSentence: cleanHanzi,
        bankChips: chips
      });

      // 4. Tone Challenge
      const firstTone = (w.jyutping.match(/[1-6]/) || ['1'])[0];
      const syl = w.jyutping.split(/\s+/)[0];
      queue.push({
        type: 'tone_challenge',
        word: w,
        syllable: syl.replace(/[1-6]/, ''),
        correctTone: parseInt(firstTone, 10),
        prompt: `Identify the tone for syllable: <strong style="color:var(--accent);">${syl}</strong>`
      });
    });

    // 5. Match Pairs Exercise (5 pairs)
    const matchSlice = words.slice(0, 5);
    if (matchSlice.length >= 4) {
      queue.push({
        type: 'match_pairs',
        pairs: matchSlice.map(w => ({ id: w.id, hanzi: w.hanzi, english: (w.english || '').split(';')[0].trim() }))
      });
    }

    // 6. Fill in the blank
    const fillSample = words.find(w => w.example && w.example.hanzi && w.example.hanzi.includes(w.hanzi)) || words[0];
    if (fillSample && fillSample.example && fillSample.example.hanzi) {
      const sentence = fillSample.example.hanzi;
      const blanked = sentence.replace(fillSample.hanzi, ' [ _____ ] ');
      const fillChoices = [
        fillSample.hanzi,
        ...allWords.filter(x => x.id !== fillSample.id).map(x => x.hanzi).sort(() => Math.random() - 0.5).slice(0, 3)
      ].sort(() => Math.random() - 0.5);

      queue.push({
        type: 'fill_blank',
        word: fillSample,
        sentence: blanked,
        translation: fillSample.example.english,
        choices: fillChoices.map(c => ({ text: c, isCorrect: c === fillSample.hanzi }))
      });
    }

    return queue.sort(() => Math.random() - 0.5).slice(0, 10);
  }

  function renderCurrentExercise() {
    const stage = document.getElementById('duo-stage-container');
    const feedbackBar = document.getElementById('duo-feedback-bar');
    const heartsCount = document.getElementById('duo-hearts-count');
    const progressFill = document.getElementById('duo-progress-fill');

    if (!stage) return;
    if (feedbackBar) feedbackBar.className = 'duo-feedback-bar';

    appState.runner.answered = false;
    appState.runner.selectedChoice = null;

    if (heartsCount) heartsCount.textContent = appState.progress.hearts;

    const progressPct = Math.min(100, Math.round((appState.runner.correctCount / Math.max(1, appState.runner.totalExercises)) * 100));
    if (progressFill) progressFill.style.width = `${progressPct}%`;

    // Completion condition: all exercises in queue finished!
    if (appState.runner.queue.length === 0 || appState.runner.currentIndex >= appState.runner.queue.length) {
      completeLessonSession();
      return;
    }

    const ex = appState.runner.queue[appState.runner.currentIndex];

    if (ex.type === 'multiple_choice') {
      renderMultipleChoiceExercise(stage, ex);
    } else if (ex.type === 'listen_choose') {
      renderListenChooseExercise(stage, ex);
    } else if (ex.type === 'word_bank') {
      renderWordBankExercise(stage, ex);
    } else if (ex.type === 'tone_challenge') {
      renderToneChallengeExercise(stage, ex);
    } else if (ex.type === 'match_pairs') {
      renderMatchPairsExercise(stage, ex);
    } else if (ex.type === 'fill_blank') {
      renderFillBlankExercise(stage, ex);
    }
  }

  function renderMultipleChoiceExercise(stage, ex) {
    stage.innerHTML = `
      <h3 class="duo-exercise-title">${ex.prompt}</h3>
      ${ex.promptJp ? `
        <div class="duo-prompt-bubble">
          <button class="speaker-btn" onclick="speakText('${ex.word.hanzi}')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </button>
          <div class="duo-prompt-jp">${ex.promptJp}</div>
        </div>
      ` : ''}
      <div class="duo-options-grid">
        ${ex.choices.map((c, idx) => `
          <button class="duo-choice-card" onclick="selectChoice(${idx}, ${c.isCorrect})">
            <span>${c.text}</span>
            <span class="choice-num" style="color:var(--text-tertiary); font-size:0.85rem;">${idx + 1}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderListenChooseExercise(stage, ex) {
    stage.innerHTML = `
      <h3 class="duo-exercise-title">${ex.prompt}</h3>
      <div style="text-align: center; margin: 2rem 0;">
        <button class="btn btn-primary" onclick="speakText('${ex.word.hanzi}')" style="width: 80px; height: 80px; border-radius: 50%; font-size: 2rem;">
          🔊
        </button>
      </div>
      <div class="duo-options-grid">
        ${ex.choices.map((c, idx) => `
          <button class="duo-choice-card" onclick="selectChoice(${idx}, ${c.isCorrect})">
            <span>${c.text}</span>
          </button>
        `).join('')}
      </div>
    `;
    setTimeout(() => speakText(ex.word.hanzi), 300);
  }

  function renderWordBankExercise(stage, ex) {
    appState.runner.wordBankTarget = [];
    appState.runner.wordBankPool = [...ex.bankChips];

    stage.innerHTML = `
      <h3 class="duo-exercise-title">${ex.prompt}</h3>
      <div class="duo-sentence-target-line" id="duo-target-line"></div>
      <div class="duo-word-bank-pool" id="duo-bank-pool">
        ${ex.bankChips.map((ch, idx) => `
          <button class="duo-word-chip" data-idx="${idx}" onclick="tapBankChip(${idx})">${ch}</button>
        `).join('')}
      </div>
      <div style="margin-top: 1.5rem; text-align: center;">
        <button class="btn btn-primary" onclick="checkWordBankSentence('${ex.targetSentence}')">Check Answer</button>
      </div>
    `;
  }

  window.tapBankChip = function (poolIdx) {
    if (appState.runner.answered) return;
    const pool = appState.runner.wordBankPool;
    const char = pool[poolIdx];
    if (!char) return;

    appState.runner.wordBankTarget.push({ char, poolIdx });
    renderWordBankSlots();
  };

  window.removeTargetChip = function (targetIdx) {
    if (appState.runner.answered) return;
    appState.runner.wordBankTarget.splice(targetIdx, 1);
    renderWordBankSlots();
  };

  function renderWordBankSlots() {
    const line = document.getElementById('duo-target-line');
    const poolContainer = document.getElementById('duo-bank-pool');
    if (!line || !poolContainer) return;

    line.innerHTML = appState.runner.wordBankTarget.map((item, tIdx) => `
      <button class="duo-word-chip" onclick="removeTargetChip(${tIdx})">${item.char}</button>
    `).join('');

    const usedIndices = new Set(appState.runner.wordBankTarget.map(x => x.poolIdx));
    poolContainer.querySelectorAll('.duo-word-chip').forEach(btn => {
      const idx = parseInt(btn.dataset.idx, 10);
      btn.className = `duo-word-chip ${usedIndices.has(idx) ? 'used' : ''}`;
    });
  }

  window.checkWordBankSentence = function (targetSentence) {
    if (appState.runner.answered) return;
    const constructed = appState.runner.wordBankTarget.map(x => x.char).join('');
    const isCorrect = constructed === targetSentence;
    handleExerciseResult(isCorrect, targetSentence);
  };

  function renderToneChallengeExercise(stage, ex) {
    stage.innerHTML = `
      <h3 class="duo-exercise-title">${ex.prompt}</h3>
      <div style="text-align: center; margin: 1.5rem 0;">
        <button class="btn btn-secondary" onclick="speakText('${ex.word.hanzi}')" style="padding: 10px 24px; font-size: 1.1rem;">
          🔊 Hear Syllable
        </button>
      </div>
      <div class="duo-tone-dial-grid">
        ${[1, 2, 3, 4, 5, 6].map(t => `
          <button class="duo-tone-dial-btn" onclick="selectToneChoice(${t}, ${ex.correctTone})">
            <strong style="font-size: 1.8rem; color: var(--accent);">Tone ${t}</strong>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">${getTonePitchName(t)}</span>
          </button>
        `).join('')}
      </div>
    `;
    setTimeout(() => speakText(ex.word.hanzi), 300);
  }

  function getTonePitchName(t) {
    const names = { 1: '55 High', 2: '35 High Rising', 3: '33 Mid Level', 4: '21 Low Falling', 5: '23 Low Rising', 6: '22 Low Level' };
    return names[t] || '';
  }

  window.selectToneChoice = function (chosenTone, correctTone) {
    if (appState.runner.answered) return;
    const isCorrect = chosenTone === correctTone;
    handleExerciseResult(isCorrect, `Tone ${correctTone} (${getTonePitchName(correctTone)})`);
  };

  function renderMatchPairsExercise(stage, ex) {
    appState.runner.matchedPairsCount = 0;
    appState.runner.matchSelectedLeft = null;
    appState.runner.matchSelectedRight = null;

    const leftItems = [...ex.pairs].sort(() => Math.random() - 0.5);
    const rightItems = [...ex.pairs].sort(() => Math.random() - 0.5);

    stage.innerHTML = `
      <h3 class="duo-exercise-title">Tap matching pairs:</h3>
      <div class="duo-match-pairs-container">
        <div style="display: flex; flex-direction: column; gap: 0.6rem;" id="match-left-col">
          ${leftItems.map(item => `
            <button class="duo-match-tile" data-pair-id="${item.id}" onclick="tapMatchLeft('${item.id}')">${item.hanzi}</button>
          `).join('')}
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.6rem;" id="match-right-col">
          ${rightItems.map(item => `
            <button class="duo-match-tile" data-pair-id="${item.id}" onclick="tapMatchRight('${item.id}')">${item.english}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  window.tapMatchLeft = function (id) {
    appState.runner.matchSelectedLeft = id;
    document.querySelectorAll('#match-left-col .duo-match-tile').forEach(b => {
      b.classList.toggle('selected', b.dataset.pairId === id);
    });
    checkMatchPair();
  };

  window.tapMatchRight = function (id) {
    appState.runner.matchSelectedRight = id;
    document.querySelectorAll('#match-right-col .duo-match-tile').forEach(b => {
      b.classList.toggle('selected', b.dataset.pairId === id);
    });
    checkMatchPair();
  };

  function checkMatchPair() {
    const l = appState.runner.matchSelectedLeft;
    const r = appState.runner.matchSelectedRight;
    if (!l || !r) return;

    if (l === r) {
      playSoundFX('correct');
      const leftBtn = document.querySelector(`#match-left-col [data-pair-id="${l}"]`);
      const rightBtn = document.querySelector(`#match-right-col [data-pair-id="${r}"]`);
      if (leftBtn) leftBtn.className = 'duo-match-tile matched';
      if (rightBtn) rightBtn.className = 'duo-match-tile matched';
      appState.runner.matchSelectedLeft = null;
      appState.runner.matchSelectedRight = null;
      appState.runner.matchedPairsCount++;

      if (appState.runner.matchedPairsCount >= 4) {
        handleExerciseResult(true, 'All pairs matched!');
      }
    } else {
      playSoundFX('wrong');
      appState.progress.hearts = Math.max(0, appState.progress.hearts - 1);
      const hCount = document.getElementById('duo-hearts-count');
      if (hCount) hCount.textContent = appState.progress.hearts;

      setTimeout(() => {
        document.querySelectorAll('.duo-match-tile.selected').forEach(b => b.classList.remove('selected'));
        appState.runner.matchSelectedLeft = null;
        appState.runner.matchSelectedRight = null;
      }, 400);

      if (appState.progress.hearts <= 0) {
        showOutOfHeartsScreen();
      }
    }
  }

  function renderFillBlankExercise(stage, ex) {
    stage.innerHTML = `
      <h3 class="duo-exercise-title">Complete the sentence:</h3>
      <div class="duo-prompt-bubble" style="flex-direction: column; align-items: flex-start;">
        <div style="font-size: 1.6rem; font-weight: 700; color: var(--text-chinese);">${ex.sentence}</div>
        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 4px;">"${ex.translation}"</p>
      </div>
      <div class="duo-options-grid">
        ${ex.choices.map((c, idx) => `
          <button class="duo-choice-card" onclick="selectChoice(${idx}, ${c.isCorrect})">
            <span>${c.text}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  window.selectChoice = function (idx, isCorrect) {
    if (appState.runner.answered) return;
    const ex = appState.runner.queue[appState.runner.currentIndex];
    const correctText = ex.choices.find(c => c.isCorrect).text;
    handleExerciseResult(isCorrect, correctText);
  };

  function handleExerciseResult(isCorrect, correctAnswerText) {
    appState.runner.answered = true;
    const feedbackBar = document.getElementById('duo-feedback-bar');
    const icon = document.getElementById('duo-feedback-icon');
    const title = document.getElementById('duo-feedback-title');
    const desc = document.getElementById('duo-feedback-desc');
    const heartsCount = document.getElementById('duo-hearts-count');

    if (!feedbackBar) return;

    if (isCorrect) {
      playSoundFX('correct');
      appState.runner.correctCount++;
      feedbackBar.className = 'duo-feedback-bar show correct';
      if (icon) icon.textContent = '✓';
      if (title) title.textContent = 'Nice! 正呀！';
      if (desc) desc.textContent = '';

      const ex = appState.runner.queue[appState.runner.currentIndex];
      if (ex && ex.word) updateWordSrs(ex.word.id, true);
    } else {
      playSoundFX('wrong');
      appState.runner.mistakesCount++;
      appState.progress.hearts = Math.max(0, appState.progress.hearts - 1);
      if (heartsCount) heartsCount.textContent = appState.progress.hearts;

      feedbackBar.className = 'duo-feedback-bar show wrong';
      if (icon) icon.textContent = '✕';
      if (title) title.textContent = 'Correct answer:';
      if (desc) desc.textContent = correctAnswerText;

      // Re-queue the exercise to the end so user must practice again
      const currentEx = appState.runner.queue[appState.runner.currentIndex];
      if (currentEx) {
        appState.runner.queue.push(currentEx);
      }

      if (currentEx && currentEx.word) updateWordSrs(currentEx.word.id, false);
    }

    const continueBtn = document.getElementById('duo-feedback-continue-btn');
    if (continueBtn) {
      continueBtn.onclick = () => {
        feedbackBar.className = 'duo-feedback-bar';

        if (appState.progress.hearts <= 0) {
          showOutOfHeartsScreen();
          return;
        }

        appState.runner.currentIndex++;
        renderCurrentExercise();
      };
    }
  }

  function showOutOfHeartsScreen() {
    const stage = document.getElementById('duo-stage-container');
    const feedbackBar = document.getElementById('duo-feedback-bar');
    if (feedbackBar) feedbackBar.className = 'duo-feedback-bar';
    if (!stage) return;

    stage.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <div style="font-size: 4rem; margin-bottom: 0.8rem;">💔</div>
        <h2 style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Out of Hearts!</h2>
        <p style="font-size: 1rem; color: var(--text-secondary); max-width: 400px; margin: 0 auto 2rem; line-height: 1.5;">
          You ran out of hearts during this session. Practice weak words to earn hearts back, or try this lesson again with full hearts!
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-secondary" onclick="refillHeartsAndRetry()">Try Again (Refill ❤️)</button>
          <button class="btn btn-primary" onclick="refillHeartsAndPracticeWeak()">Practice to Earn Hearts 🎯</button>
        </div>
      </div>
    `;
  }

  window.refillHeartsAndRetry = function () {
    appState.progress.hearts = 5;
    saveProgress();
    const u = appState.runner.unit;
    const l = appState.runner.lessonIndex;
    startLessonSession(u ? u.id : 'unit-1', l || 1, false);
  };

  window.refillHeartsAndPracticeWeak = function () {
    appState.progress.hearts = 5;
    saveProgress();
    const u = appState.runner.unit;
    practiceWeakWords(u ? u.id : 'unit-1');
  };

  function updateWordSrs(wordId, wasCorrect) {
    if (!appState.srs[wordId]) {
      appState.srs[wordId] = { stage: 1, due: new Date().toISOString().slice(0, 10) };
    }
    const item = appState.srs[wordId];
    if (wasCorrect) {
      item.stage = Math.min(4, (item.stage || 1) + 1);
      const intervals = { 1: 1, 2: 3, 3: 7, 4: 14 };
      const d = new Date();
      d.setDate(d.getDate() + (intervals[item.stage] || 1));
      item.due = d.toISOString().slice(0, 10);
    } else {
      item.stage = 1;
      item.due = new Date().toISOString().slice(0, 10);
    }
    saveStorage(STORAGE_KEYS.SRS, appState.srs);
  }

  // --- 9. "Great Job" Completion Animation & Real XP Calculation ---
  function completeLessonSession() {
    const compOverlay = document.getElementById('duo-completion-overlay');
    if (!compOverlay) return;

    const mistakes = appState.runner.mistakesCount;
    const totalEx = Math.max(1, appState.runner.totalExercises);
    const accuracy = Math.max(0, Math.min(100, Math.round(((totalEx - mistakes) / totalEx) * 100)));

    // Real XP Calculation:
    // 10 XP per unique word/exercise, +5 bonus for perfect lesson, streak bonus (+2/day max 20)
    let xpEarned = 0;
    if (appState.runner.isTestOut) {
      xpEarned = accuracy >= 80 ? 50 : 20;
    } else if (appState.runner.isWeakPractice) {
      xpEarned = 15;
    } else {
      const streakCount = appState.progress.streak ? appState.progress.streak.count : 1;
      const streakBonus = Math.min(20, streakCount * 2);
      const perfectBonus = mistakes === 0 ? 5 : 0;
      xpEarned = (appState.runner.words || []).length * 10 + perfectBonus + streakBonus;
    }

    const oldXp = appState.progress.xp || 0;
    const oldLevel = getXpLevelInfo(oldXp).level;
    const newXp = oldXp + xpEarned;
    const newLvlInfo = getXpLevelInfo(newXp);
    const isLevelUp = newLvlInfo.level > oldLevel;

    // Apply XP & weekly log
    appState.progress.xp = newXp;
    const today = new Date().toISOString().slice(0, 10);
    appState.progress.weeklyXp[today] = (appState.progress.weeklyXp[today] || 0) + xpEarned;

    // Mark lesson complete and unlock progression
    const currentUnit = appState.runner.unit;
    const currentLessonIdx = appState.runner.lessonIndex;
    let nextUnitId = null;
    let nextLessonIdx = null;

    if (currentUnit && currentLessonIdx > 0) {
      const key = `${currentUnit.id}-l${currentLessonIdx}`;
      appState.progress.completedLessons[key] = true;

      // Extract unit number from ID (e.g. "unit-1" -> 1)
      const uNumMatch = currentUnit.id.match(/\d+/);
      const currentUnitNum = uNumMatch ? parseInt(uNumMatch[0], 10) : 1;

      if (appState.runner.isTestOut && accuracy >= 80) {
        // Test out: mark all 4 lessons complete and unlock next unit
        for (let l = 1; l <= 4; l++) {
          appState.progress.completedLessons[`${currentUnit.id}-l${l}`] = true;
        }
        appState.progress.unlockedUnit = Math.max(appState.progress.unlockedUnit || 1, currentUnitNum + 1);
        nextUnitId = `unit-${currentUnitNum + 1}`;
        nextLessonIdx = 1;
      } else {
        if (currentLessonIdx < 4) {
          nextUnitId = currentUnit.id;
          nextLessonIdx = currentLessonIdx + 1;
        } else {
          // Finished lesson 4 of this unit: UNLOCK NEXT UNIT!
          appState.progress.unlockedUnit = Math.max(appState.progress.unlockedUnit || 1, currentUnitNum + 1);
          nextUnitId = `unit-${currentUnitNum + 1}`;
          nextLessonIdx = 1;
        }
      }
    }

    // Add words to learned list
    let newWordsCount = 0;
    (appState.runner.words || []).forEach(w => {
      if (!appState.progress.learned.includes(w.id)) {
        appState.progress.learned.push(w.id);
        newWordsCount++;
      }
    });

    saveProgress();

    // Populate Dynamic Title based on accuracy
    const titleEl = document.getElementById('completion-title');
    const subTitleEl = document.getElementById('completion-subtitle');
    if (titleEl) {
      if (accuracy === 100) titleEl.textContent = 'Perfect! 完美！';
      else if (accuracy >= 90) titleEl.textContent = 'On fire! 勁呀！';
      else if (accuracy >= 75) titleEl.textContent = 'Nice work! 好嘢！';
      else titleEl.textContent = 'Great job! 搞掂！';
    }
    if (subTitleEl) {
      if (accuracy === 100) subTitleEl.textContent = 'Flawless execution! Not a single mistake.';
      else if (accuracy >= 80) subTitleEl.textContent = 'Solid Cantonese skills! Keep the momentum going.';
      else subTitleEl.textContent = 'Practice makes fluent. Hong Kong is one step closer!';
    }

    // Populate Stats
    const xpEl = document.getElementById('duo-complete-xp');
    const accEl = document.getElementById('duo-complete-accuracy');
    const wordsEl = document.getElementById('duo-complete-words');
    const streakEl = document.getElementById('duo-complete-streak');

    if (xpEl) xpEl.textContent = `+${xpEarned}`;
    if (accEl) accEl.textContent = `${accuracy}%`;
    if (wordsEl) wordsEl.textContent = newWordsCount > 0 ? `+${newWordsCount}` : `${(appState.runner.words || []).length}`;
    if (streakEl) streakEl.textContent = `${appState.progress.streak ? appState.progress.streak.count : 1} 🔥`;

    // Populate XP progress bar
    const xpLvlLabel = document.getElementById('completion-xp-level-label');
    const xpNumLabel = document.getElementById('completion-xp-numbers');
    const xpFillEl = document.getElementById('completion-xp-fill');
    const levelUpMsg = document.getElementById('completion-levelup-msg');

    if (xpLvlLabel) xpLvlLabel.textContent = `Level ${newLvlInfo.level}`;
    if (xpNumLabel) xpNumLabel.textContent = `${newLvlInfo.xpInLevel} / ${newLvlInfo.needed} XP`;
    if (xpFillEl) {
      xpFillEl.style.width = '0%';
      setTimeout(() => {
        xpFillEl.style.width = `${newLvlInfo.progressPct}%`;
      }, 350);
    }

    if (levelUpMsg) {
      if (isLevelUp) {
        levelUpMsg.style.display = 'block';
        levelUpMsg.textContent = `🎉 Level Up to Level ${newLvlInfo.level}!`;
        playSoundFX('levelup');
      } else {
        levelUpMsg.style.display = 'none';
        playSoundFX('complete');
      }
    }

    // Trigger SVG checkmark draw animation
    const checkRing = document.getElementById('completion-check-ring');
    if (checkRing) {
      checkRing.classList.remove('animated');
      setTimeout(() => checkRing.classList.add('animated'), 100);
    }

    // Stagger slide-in for stat cards
    document.querySelectorAll('#completion-stats-row .stat-anim').forEach((card, idx) => {
      card.classList.remove('stat-visible');
      setTimeout(() => card.classList.add('stat-visible'), 250 + idx * 90);
    });

    // Open overlay & start confetti
    compOverlay.classList.add('open');
    startConfetti();

    // Wire buttons
    const finishBtn = document.getElementById('duo-complete-finish-btn');
    const nextLessonBtn = document.getElementById('duo-complete-next-btn');

    const closeAllOverlays = () => {
      stopConfetti();
      compOverlay.classList.remove('open');
      const runnerOverlay = document.getElementById('duo-runner-overlay');
      if (runnerOverlay) runnerOverlay.classList.remove('open');
      renderSkillPath();
    };

    if (finishBtn) {
      finishBtn.onclick = () => {
        closeAllOverlays();
        scrollToCurrentNode();
        showToast(`+${xpEarned} XP saved to your profile!`, '🔥');
      };
    }

    if (nextLessonBtn) {
      nextLessonBtn.onclick = () => {
        closeAllOverlays();
        if (nextUnitId && nextLessonIdx) {
          startLessonSession(nextUnitId, nextLessonIdx, false);
        } else {
          scrollToCurrentNode();
        }
      };
    }
  }

  // Soft Confetti Simulation on Canvas
  let confettiAnimationId = null;
  function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#0071e3', '#34c759', '#ff9500', '#af52de', '#ff2d55', '#ffd60a', '#5856d6'];
    const particles = Array.from({ length: 75 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5 - canvas.height * 0.5,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 2.8 + 1.8,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 4 - 2
    }));

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        if (p.y > canvas.height) p.y = -10;
      });
      confettiAnimationId = requestAnimationFrame(frame);
    }
    frame();
  }

  function stopConfetti() {
    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = null;
    }
  }

  // --- 10. Writing Practice Studio ---
  function initWritingStudio() {
    const charSelect = document.getElementById('stroke-char-select');
    const watchBtn = document.getElementById('btn-watch-stroke');
    const quizBtn = document.getElementById('btn-quiz-stroke');
    const nextBtn = document.getElementById('btn-next-stroke-char');
    const practiceList = window.CANTONESE_DATA.practiceCharacters || [];

    if (charSelect) {
      charSelect.innerHTML = practiceList.map((c, i) => `
        <option value="${i}">${c.char} - ${c.jyutping} (${c.meaning})</option>
      `).join('');
      charSelect.addEventListener('change', (e) => {
        appState.strokeCharIndex = parseInt(e.target.value, 10);
        loadStrokeCharacter();
      });
    }

    if (watchBtn) {
      watchBtn.addEventListener('click', () => {
        if (appState.hanziWriter) appState.hanziWriter.animateCharacter();
      });
    }

    if (quizBtn) {
      quizBtn.addEventListener('click', () => {
        if (appState.hanziWriter) {
          appState.hanziWriter.quiz({
            onMistake: () => showToast('Careful with stroke direction!', '✏️'),
            onComplete: (summary) => {
              showToast(`Character completed! Mistakes: ${summary.totalMistakes}`, '🎉');
              const c = practiceList[appState.strokeCharIndex];
              if (c && !appState.progress.writingMastered.includes(c.char)) {
                appState.progress.writingMastered.push(c.char);
                saveProgress();
              }
            }
          });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        appState.strokeCharIndex = (appState.strokeCharIndex + 1) % practiceList.length;
        if (charSelect) charSelect.value = appState.strokeCharIndex;
        loadStrokeCharacter();
      });
    }

    initFreeDrawCanvas();
    initTypingDrill();
    initWritingSubmodeSwitch();
    loadStrokeCharacter();
  }

  function loadStrokeCharacter() {
    const list = window.CANTONESE_DATA.practiceCharacters || [];
    const item = list[appState.strokeCharIndex] || list[0];
    if (!item) return;

    const infoJp = document.getElementById('stroke-info-jp');
    const infoEn = document.getElementById('stroke-info-en');
    const fallbackAlert = document.getElementById('stroke-fallback-alert');
    const targetBox = document.getElementById('hanzi-writer-target');

    if (infoJp) infoJp.textContent = item.jyutping;
    if (infoEn) infoEn.textContent = item.meaning;

    if (!targetBox) return;
    targetBox.innerHTML = '';

    if (item.isDialect) {
      if (fallbackAlert) fallbackAlert.style.display = 'flex';
      targetBox.style.display = 'none';
      return;
    } else {
      if (fallbackAlert) fallbackAlert.style.display = 'none';
      targetBox.style.display = 'flex';
    }

    if (typeof HanziWriter === 'undefined') {
      targetBox.innerHTML = `<span style="font-size: 5rem; color: var(--accent);">${item.char}</span>`;
      return;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    try {
      appState.hanziWriter = HanziWriter.create(targetBox, item.char, {
        width: 260,
        height: 260,
        padding: 20,
        strokeColor: isDark ? '#ffffff' : '#1d1d1f',
        outlineColor: isDark ? '#44444a' : '#d2d2d7',
        highlightColor: isDark ? '#2997ff' : '#0071e3',
        drawingColor: isDark ? '#2997ff' : '#0071e3',
        strokeAnimationSpeed: 1.2,
        charDataLoader: function (char, onComplete, onFail) {
          if (window.PRELOADED_STROKES && window.PRELOADED_STROKES[char]) {
            onComplete(window.PRELOADED_STROKES[char]);
            return;
          }
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`)
            .then(res => res.json())
            .then(data => onComplete(data))
            .catch(() => {
              if (onFail) onFail();
              if (fallbackAlert) fallbackAlert.style.display = 'flex';
              targetBox.style.display = 'none';
            });
        }
      });
    } catch (e) {
      targetBox.innerHTML = `<span style="font-size: 5rem; color: var(--accent);">${item.char}</span>`;
    }
  }

  function initFreeDrawCanvas() {
    const canvas = document.getElementById('tian-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const charSelect = document.getElementById('freedraw-char-select');
    const watermark = document.getElementById('canvas-watermark-char');
    const guideBtn = document.getElementById('btn-toggle-guide');
    const undoBtn = document.getElementById('btn-undo-draw');
    const clearBtn = document.getElementById('btn-clear-draw');
    const masteredBtn = document.getElementById('btn-mastered-char');
    const switchBtn = document.getElementById('btn-switch-to-freedraw');

    const list = window.CANTONESE_DATA.practiceCharacters || [];
    if (charSelect) {
      charSelect.innerHTML = list.map(c => `<option value="${c.char}">${c.char} (${c.jyutping})</option>`).join('');
      charSelect.addEventListener('change', e => {
        if (watermark) watermark.textContent = e.target.value;
      });
    }

    if (guideBtn) {
      guideBtn.addEventListener('click', () => {
        appState.freeDrawGuide = !appState.freeDrawGuide;
        guideBtn.textContent = appState.freeDrawGuide ? 'Guide: ON' : 'Guide: OFF';
        if (watermark) watermark.style.opacity = appState.freeDrawGuide ? '1' : '0';
      });
    }

    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (appState.canvasHistory.length > 0) {
          appState.canvasHistory.pop();
          redrawTianCanvas();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        appState.canvasHistory = [];
        redrawTianCanvas();
      });
    }

    if (masteredBtn) {
      masteredBtn.addEventListener('click', () => {
        const char = charSelect ? charSelect.value : '好';
        if (!appState.progress.writingMastered.includes(char)) {
          appState.progress.writingMastered.push(char);
          saveProgress();
        }
        showToast(`Mastered "${char}"! Saved to writing stats.`, '🔥');
      });
    }

    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        document.getElementById('btn-mode-freedraw').click();
        const curr = list[appState.strokeCharIndex];
        if (curr && charSelect) {
          charSelect.value = curr.char;
          if (watermark) watermark.textContent = curr.char;
        }
      });
    }

    let isDrawing = false;
    let stroke = [];

    canvas.addEventListener('pointerdown', e => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      stroke = [{ x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }];
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', e => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      stroke.push({ x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy });
      drawLiveCanvasStroke(ctx, stroke);
    });

    canvas.addEventListener('pointerup', () => {
      if (!isDrawing) return;
      isDrawing = false;
      if (stroke.length > 0) {
        appState.canvasHistory.push([...stroke]);
        stroke = [];
      }
      redrawTianCanvas();
    });

    drawTianGrid();
  }

  function drawTianGrid() {
    const canvas = document.getElementById('tian-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(41, 151, 255, 0.28)' : 'rgba(0, 113, 227, 0.22)';
    const dashColor = isDark ? 'rgba(41, 151, 255, 0.16)' : 'rgba(0, 113, 227, 0.14)';

    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();

    ctx.strokeStyle = dashColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, h);
    ctx.moveTo(w, 0); ctx.lineTo(0, h);
    ctx.stroke();
    ctx.restore();
  }

  function redrawTianCanvas() {
    drawTianGrid();
    const canvas = document.getElementById('tian-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const color = isDark ? '#ffffff' : '#1d1d1f';

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    appState.canvasHistory.forEach(s => {
      if (s.length < 2) {
        if (s.length === 1) {
          ctx.beginPath();
          ctx.arc(s[0].x, s[0].y, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawLiveCanvasStroke(ctx, stroke) {
    if (stroke.length < 2) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.save();
    ctx.strokeStyle = isDark ? '#ffffff' : '#1d1d1f';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const p1 = stroke[stroke.length - 2];
    const p2 = stroke[stroke.length - 1];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  }

  function initTypingDrill() {
    const checkBtn = document.getElementById('typing-check-btn');
    const input = document.getElementById('typing-input-field');
    const nextBtn = document.getElementById('typing-next-btn');

    const drillList = (window.CANTONESE_DATA.practiceCharacters || []).concat([
      { char: '搞掂', jyutping: 'gaau2 dim2', meaning: 'all settled' },
      { char: '好正', jyutping: 'hou2 zeng3', meaning: 'awesome' },
      { char: '唔該', jyutping: 'm4 goi1', meaning: 'thank you' },
      { char: '早晨', jyutping: 'zou2 san4', meaning: 'good morning' }
    ]);

    function showWord() {
      const w = drillList[appState.currentTypingIndex % drillList.length];
      const charEl = document.getElementById('typing-char-display');
      const meanEl = document.getElementById('typing-char-meaning');
      const feedback = document.getElementById('typing-feedback');
      if (charEl) charEl.textContent = w.char;
      if (meanEl) meanEl.textContent = `Meaning: ${w.meaning}`;
      if (feedback) { feedback.textContent = ''; feedback.className = 'typing-feedback-message'; }
      if (input) { input.value = ''; input.focus(); }
    }

    function check() {
      const w = drillList[appState.currentTypingIndex % drillList.length];
      const raw = (input ? input.value : '').trim().toLowerCase();
      const feedback = document.getElementById('typing-feedback');
      if (!raw) return;

      const target = w.jyutping.toLowerCase();
      const targetNoTone = target.replace(/[0-9\s]/g, '');
      const rawNoTone = raw.replace(/[0-9\s]/g, '');

      if (raw.replace(/\s+/g, '') === target.replace(/\s+/g, '') || raw === target) {
        if (feedback) {
          feedback.textContent = `✓ Perfect! ${w.char} is "${w.jyutping}".`;
          feedback.className = 'typing-feedback-message success';
        }
        playSoundFX('correct');
        speakText(w.char);
      } else if (rawNoTone === targetNoTone) {
        if (feedback) {
          feedback.textContent = `Close! The romanization sound is right, but check the tone mark: "${w.jyutping}".`;
          feedback.className = 'typing-feedback-message hint';
        }
        speakText(w.char);
      } else {
        if (feedback) {
          feedback.textContent = `Not quite. Standard Jyutping: "${w.jyutping}".`;
          feedback.className = 'typing-feedback-message hint';
        }
      }
    }

    if (checkBtn) checkBtn.addEventListener('click', check);
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { appState.currentTypingIndex++; showWord(); });
    showWord();
  }

  function initWritingSubmodeSwitch() {
    const btns = {
      stroke: document.getElementById('btn-mode-stroke'),
      freedraw: document.getElementById('btn-mode-freedraw'),
      typing: document.getElementById('btn-mode-typing')
    };
    const views = {
      stroke: document.getElementById('writing-submode-stroke'),
      freedraw: document.getElementById('writing-submode-freedraw'),
      typing: document.getElementById('writing-submode-typing')
    };

    function setSub(mode) {
      Object.keys(btns).forEach(m => {
        if (btns[m]) btns[m].classList.toggle('active', m === mode);
        if (views[m]) views[m].style.display = m === mode ? 'block' : 'none';
      });
      if (mode === 'freedraw') setTimeout(redrawTianCanvas, 40);
    }

    if (btns.stroke) btns.stroke.addEventListener('click', () => setSub('stroke'));
    if (btns.freedraw) btns.freedraw.addEventListener('click', () => setSub('freedraw'));
    if (btns.typing) btns.typing.addEventListener('click', () => setSub('typing'));
  }

  // --- 11. Curriculum Renderers (Tones, Phrases, Food, Grammar, Slang) ---
  function renderTones() {
    const container = document.getElementById('tones-grid-container');
    if (!container || !window.CANTONESE_DATA) return;

    container.innerHTML = window.CANTONESE_DATA.tones.map(t => `
      <div class="glass-card tone-card" data-tone="${t.tone}" data-freq-start="${t.freqStart}" data-freq-end="${t.freqEnd}" data-sample="${t.sampleChar}">
        <div class="tone-number-badge">${t.tone}</div>
        <div class="tone-char">${t.sampleChar}</div>
        <div class="tone-jp">${t.jyutping}</div>
        <div class="tone-name">${t.pitch} · ${t.name.split(' ')[0]}</div>
        <div style="font-size: 0.78rem; color: var(--text-tertiary);">${t.meaning}</div>
        <button class="speaker-btn" title="Hear Tone ${t.tone}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.tone-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.add('playing');
        playToneContour(parseFloat(card.dataset.freqStart), parseFloat(card.dataset.freqEnd), 0.55);
        setTimeout(() => speakText(card.dataset.sample, 0.75), 160);
        setTimeout(() => card.classList.remove('playing'), 650);
      });
    });
  }

  function renderPhonology(type = 'initials') {
    const container = document.getElementById('phonology-list');
    if (!container || !window.CANTONESE_DATA) return;
    const list = type === 'initials' ? window.CANTONESE_DATA.initials : window.CANTONESE_DATA.finals;

    container.innerHTML = list.map(item => `
      <div class="glass-card phonology-card">
        <div>
          <div class="main">${item.char || '-' + item.sound} ${item.ipa ? `<span style="font-size:0.85rem;color:var(--text-secondary);font-weight:normal;">${item.ipa}</span>` : ''}</div>
          <div class="sub">${item.example}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 2px;">${item.soundLike || item.desc}</div>
        </div>
        <button class="speaker-btn" onclick="speakText('${item.example.split(' ')[0]}')" title="Hear sound">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </button>
      </div>
    `).join('');
  }

  function renderPhrases() {
    const container = document.getElementById('phrases-grid');
    if (!container || !window.CANTONESE_DATA) return;
    container.innerHTML = window.CANTONESE_DATA.phrases.map(p => {
      const isLearned = appState.progress.learned.includes(p.id);
      return `
        <div class="glass-card vocab-card" id="card-${p.id}">
          <div class="vocab-top">
            <div>
              <div class="vocab-main">${p.chinese}</div>
              <div class="vocab-jp">${p.jyutping}</div>
              <div class="vocab-en">${p.english}</div>
            </div>
            <button class="speaker-btn" onclick="speakText('${p.chinese}')" title="Pronounce">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            </button>
          </div>
          ${p.notes ? `<div class="vocab-notes">${p.notes}</div>` : ''}
          <div class="vocab-footer">
            <span class="badge-tag">${p.category}</span>
            <button class="learned-toggle ${isLearned ? 'is-learned' : ''}" onclick="toggleLearnedWord('${p.id}', '${p.chinese}')">
              ${isLearned ? '✓ Learned' : '+ Mark Learned'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderDailyLife() {
    const container = document.getElementById('food-grid');
    if (!container || !window.CANTONESE_DATA) return;
    container.innerHTML = window.CANTONESE_DATA.dailyLife.map((item, idx) => {
      const id = 'food-' + idx;
      const isLearned = appState.progress.learned.includes(id);
      return `
        <div class="glass-card vocab-card">
          <div class="vocab-top">
            <div>
              <div class="vocab-main">${item.chinese}</div>
              <div class="vocab-jp">${item.jyutping}</div>
              <div class="vocab-en">${item.english}</div>
            </div>
            <button class="speaker-btn" onclick="speakText('${item.chinese.split(' ')[0]}')" title="Pronounce">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            </button>
          </div>
          <div class="vocab-notes">${item.context}</div>
          <div class="vocab-footer">
            <span class="badge-tag">${item.category}</span>
            <button class="learned-toggle ${isLearned ? 'is-learned' : ''}" onclick="toggleLearnedWord('${id}', '${item.chinese}')">
              ${isLearned ? '✓ Learned' : '+ Mark Learned'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderGrammar() {
    const pContainer = document.getElementById('particles-grid');
    const mContainer = document.getElementById('measure-words-container');
    const nContainer = document.getElementById('negation-container');

    if (pContainer && window.CANTONESE_DATA.grammarParticles) {
      pContainer.innerHTML = window.CANTONESE_DATA.grammarParticles.map(gp => `
        <div class="glass-card" style="padding: 1.6rem; display: flex; flex-direction: column; gap: 0.8rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 2.2rem; font-weight: 800; color: var(--accent);">${gp.particle}</span>
              <span style="font-size: 1rem; font-weight: 600; color: var(--text-secondary); margin-left: 8px;">${gp.jyutping}</span>
            </div>
            <button class="speaker-btn" onclick="speakText('${gp.particle}')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></button>
          </div>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${gp.function}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${gp.explanation}</div>
          <div class="vocab-notes" style="margin-top: auto;"><strong>Example:</strong> ${gp.example}</div>
        </div>
      `).join('');
    }

    if (mContainer && window.CANTONESE_DATA.grammarMeasureWords) {
      mContainer.innerHTML = window.CANTONESE_DATA.grammarMeasureWords.map(m => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-light); font-size: 0.9rem;">
          <div>
            <strong style="color: var(--accent); font-size: 1.15rem; margin-right: 6px;">${m.char}</strong>
            <span style="color: var(--text-secondary); font-size: 0.82rem;">(${m.jyutping})</span>
            <span style="margin-left: 8px; color: var(--text-primary);">${m.usedFor}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary);">${m.example}</div>
        </div>
      `).join('');
    }

    if (nContainer && window.CANTONESE_DATA.grammarNegation) {
      nContainer.innerHTML = window.CANTONESE_DATA.grammarNegation.map(neg => `
        <div style="padding: 10px; background: var(--bg-secondary); border-radius: var(--radius-sm);">
          <strong style="font-size: 1.25rem; color: var(--accent);">${neg.word}</strong>
          <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 6px;">(${neg.jyutping}) · ${neg.type}</span>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 6px;">${neg.usage}</p>
          <div style="font-size: 0.8rem; color: var(--text-primary);">${neg.examples.map(ex => `<div>• ${ex}</div>`).join('')}</div>
        </div>
      `).join('');
    }
  }

  function renderSlang(filter = 'all') {
    const container = document.getElementById('slang-grid');
    if (!container || !window.CANTONESE_DATA.getSlangList) return;

    let list = window.CANTONESE_DATA.getSlangList();
    if (filter === 'everyday') {
      list = list.filter(s => s.tags && s.tags.includes('colloquial'));
    } else if (filter === 'humor') {
      list = list.filter(s => s.tags && s.tags.includes('slang'));
    } else if (filter === 'vulgar') {
      list = list.filter(s => s.tags && s.tags.includes('vulgar'));
    }

    container.innerHTML = list.slice(0, 30).map(s => {
      const isLearned = appState.progress.learned.includes(s.id);
      const isVulgar = s.tags && s.tags.includes('vulgar');

      return `
        <div class="glass-card slang-card ${isVulgar ? 'vulgar' : ''}" id="slang-card-${s.id}">
          ${isVulgar ? `<button class="reveal-overlay-btn" onclick="revealSlang('${s.id}')">⚠️ Click to Reveal 18+ Slang</button>` : ''}
          <div class="slang-blur-content">
            <div class="vocab-top">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="vocab-main">${s.hanzi}</span>
                  ${isVulgar ? `<span class="badge-18">18+</span>` : `<span class="badge-tag">${s.topic}</span>`}
                </div>
                <div class="vocab-jp">${s.jyutping}</div>
                <div class="vocab-en">${s.english || ''}</div>
              </div>
              <button class="speaker-btn" onclick="speakText('${s.hanzi}')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></button>
            </div>
            ${s.example ? `
              <div class="vocab-notes" style="margin-top: 10px;">
                <strong>Example:</strong> ${s.example.hanzi}<br>
                <em style="color: var(--accent); font-size: 0.8rem;">${s.example.jyutping}</em><br>
                <span style="color: var(--text-tertiary); font-size: 0.8rem;">"${s.example.english}"</span>
              </div>
            ` : ''}
            <div class="slang-vibe-box" style="margin-top: 8px;"><strong>Context:</strong> ${s.notes || ''}</div>
          </div>
          <div class="vocab-footer" style="margin-top: 10px;">
            <span class="badge-tag" style="font-size: 0.72rem;">${s.topic || 'slang'}</span>
            <button class="learned-toggle ${isLearned ? 'is-learned' : ''}" onclick="toggleLearnedWord('${s.id}', '${s.hanzi}')">
              ${isLearned ? '✓ Learned' : '+ Mark Learned'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.revealSlang = function (id) {
    const el = document.getElementById(`slang-card-${id}`) || document.getElementById(`vcard-${id}`);
    if (el) el.classList.add('revealed');
  };

  window.toggleLearnedWord = function (id, charName) {
    const idx = appState.progress.learned.indexOf(id);
    if (idx > -1) {
      appState.progress.learned.splice(idx, 1);
      showToast(`Removed "${charName}" from learned list.`);
    } else {
      appState.progress.learned.push(id);
      showToast(`Marked "${charName}" as learned! 🔥`);
    }
    saveProgress();
    renderVocabLibrary();
  };

  // --- 12. Global Search Modal (Ctrl + K) ---
  function initGlobalSearch() {
    const modal = document.getElementById('search-modal');
    const trigger = document.getElementById('search-trigger-btn');
    const closeBtn = document.getElementById('search-close-btn');
    const input = document.getElementById('global-search-input');
    const list = document.getElementById('search-results-list');

    function open() {
      if (!modal) return;
      modal.classList.add('open');
      if (input) { input.value = ''; input.focus(); }
      queryResults('');
    }

    function close() {
      if (modal) modal.classList.remove('open');
    }

    if (trigger) trigger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) close(); });

    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open();
      } else if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
        close();
      }
    });

    if (input) input.addEventListener('input', e => queryResults(e.target.value.trim().toLowerCase()));

    function queryResults(q) {
      if (!list || !window.CANTONESE_DATA) return;
      const all = window.CANTONESE_DATA.getAllWords();
      const matches = !q ? all.slice(0, 10) : all.filter(w =>
        w.hanzi.includes(q) ||
        w.jyutping.toLowerCase().includes(q) ||
        (w.english && w.english.toLowerCase().includes(q))
      ).slice(0, 15);

      if (matches.length === 0) {
        list.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-secondary);">No results found for "${q}".</div>`;
        return;
      }

      list.innerHTML = matches.map(m => `
        <div class="search-result-item" onclick="jumpToWord('${m.id}')">
          <div>
            <span style="font-weight: 700; font-size: 1.15rem; color: var(--text-primary); margin-right: 8px;">${m.hanzi}</span>
            <span style="font-size: 0.88rem; color: var(--accent); font-weight: 600;">${m.jyutping}</span>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">${m.english || ''}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="level-tag l${m.level}">L${m.level}</span>
            <button class="speaker-btn" onclick="event.stopPropagation(); speakText('${m.hanzi}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  window.jumpToWord = function (id) {
    const modal = document.getElementById('search-modal');
    if (modal) modal.classList.remove('open');
    const libSection = document.getElementById('vocab-library');
    if (libSection) {
      appState.vocabFilter.search = '';
      appState.vocabFilter.level = 'all';
      renderVocabLibrary();
      libSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- 13. XP Rules Modal ---
  function initXpRulesModal() {
    const modal = document.getElementById('xp-rules-modal');
    const openBtn = document.getElementById('btn-show-xp-rules');
    const navPill = document.getElementById('nav-xp-pill');
    const closeBtn = document.getElementById('xp-rules-modal-close');

    const open = (e) => {
      if (e) e.preventDefault();
      if (modal) modal.classList.add('open');
    };
    const close = () => {
      if (modal) modal.classList.remove('open');
    };

    if (openBtn) openBtn.addEventListener('click', open);
    if (navPill) navPill.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) close(); });
  }

  // --- 14. Credits & License Modal ---
  function initCreditsModal() {
    const modal = document.getElementById('credits-modal');
    const link = document.getElementById('footer-credits-link');
    const closeBtn = document.getElementById('credits-modal-close');
    if (link) {
      link.addEventListener('click', e => {
        e.preventDefault();
        if (modal) modal.classList.add('open');
      });
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    }
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }
  }

  // --- 15. Auxiliary Controls & Settings ---
  function initAuxiliaryControls() {
    const sfxToggle = document.getElementById('duo-sound-toggle');
    if (sfxToggle) {
      sfxToggle.textContent = appState.settings.soundMuted ? '🔇' : '🔊';
      sfxToggle.addEventListener('click', () => {
        appState.settings.soundMuted = !appState.settings.soundMuted;
        sfxToggle.textContent = appState.settings.soundMuted ? '🔇' : '🔊';
        saveStorage(STORAGE_KEYS.SETTINGS, appState.settings);
        showToast(appState.settings.soundMuted ? 'Sound effects muted' : 'Sound effects unmuted');
      });
    }

    const runnerClose = document.getElementById('duo-runner-close');
    if (runnerClose) {
      runnerClose.addEventListener('click', () => {
        if (confirm('Leave lesson? Your current session progress will not be saved.')) {
          document.getElementById('duo-runner-overlay').classList.remove('open');
        }
      });
    }

    const resetBtn = document.getElementById('btn-reset-progress');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all local learning stats, XP, streak, and Spaced Repetition progress?')) {
          localStorage.removeItem(STORAGE_KEYS.PROGRESS);
          localStorage.removeItem(STORAGE_KEYS.SRS);
          appState.progress = { ...defaultProgress };
          appState.srs = {};
          saveProgress();
          renderSkillPath();
          renderVocabLibrary();
          showToast('Progress has been reset.');
        }
      });
    }

    // Slang filter tabs
    document.querySelectorAll('[data-slang-filter]').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-slang-filter]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderSlang(b.dataset.slangFilter);
      });
    });

    // Phonology tabs
    const tabInit = document.getElementById('tab-initials-btn');
    const tabFin = document.getElementById('tab-finals-btn');
    if (tabInit && tabFin) {
      tabInit.addEventListener('click', () => {
        tabInit.classList.add('active'); tabFin.classList.remove('active'); renderPhonology('initials');
      });
      tabFin.addEventListener('click', () => {
        tabFin.classList.add('active'); tabInit.classList.remove('active'); renderPhonology('finals');
      });
    }
  }

  // --- Initializer on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSpeech();
    initScrollExperience();

    renderTones();
    renderPhonology('initials');
    renderPhrases();
    renderDailyLife();
    renderGrammar();
    renderSlang('all');

    initVocabLibrary();
    initSkillPath();
    initWritingStudio();
    initGlobalSearch();
    initXpRulesModal();
    initCreditsModal();
    initAuxiliaryControls();

    updateDashboardStats();
  });

})();
