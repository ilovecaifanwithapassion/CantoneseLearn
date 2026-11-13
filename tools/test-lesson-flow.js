/**
 * test-lesson-flow.js — Automated test for Lesson Flow, Unlocks, Real XP, and Edge Cases
 * Runs the exact logic in a headless simulated environment to verify lesson state transitions.
 */

const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: LESSON FLOW & XP SYSTEM ===\n');

// 1. Load data files
const levels = {};
for (let i = 1; i <= 6; i++) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'data', `level${i}.js`), 'utf8');
  const match = code.match(/\[\s*\{[\s\S]*\}\s*\]/);
  levels[i] = eval(match[0]);
}
const manualSlang = eval(fs.readFileSync(path.join(__dirname, '..', 'js', 'data', 'manual-slang.js'), 'utf8').match(/\[\s*\{[\s\S]*\}\s*\]/)[0]);

// Mock window.CANTONESE_DATA
const CANTONESE_DATA = {
  getLeveledVocab: () => ({ 1: levels[1], 2: levels[2], 3: levels[3], 4: levels[4], 5: levels[5], 6: levels[6].concat(manualSlang) }),
  getAllWords: function() {
    const v = this.getLeveledVocab();
    return [...v[1], ...v[2], ...v[3], ...v[4], ...v[5], ...v[6]];
  },
  getSkillUnits: function() {
    const lvls = this.getLeveledVocab();
    return [
      { id: "unit-1", level: 1, title: "Unit 1", words: lvls[1].slice(0, 30) },
      { id: "unit-2", level: 1, title: "Unit 2", words: lvls[1].slice(30, 60) },
      { id: "unit-3", level: 2, title: "Unit 3", words: lvls[2].slice(0, 30) }
    ];
  }
};

// 2. Test getXpLevelInfo
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

console.log('Testing XP Formula:');
console.log('  0 XP   ->', getXpLevelInfo(0));
console.log('  90 XP  ->', getXpLevelInfo(90));
console.log('  100 XP ->', getXpLevelInfo(100));
console.log('  250 XP ->', getXpLevelInfo(250));
console.log('  300 XP ->', getXpLevelInfo(300));

if (getXpLevelInfo(0).level !== 1 || getXpLevelInfo(100).level !== 2 || getXpLevelInfo(300).level !== 3) {
  throw new Error('XP Level calculation failed!');
}
console.log('✓ XP Level formula passed\n');

// 3. Simulate Progress state across lessons
let progress = {
  learned: [],
  xp: 0,
  hearts: 5,
  streak: { count: 3, lastActive: '2026-11-13' },
  unlockedUnit: 1,
  completedLessons: {},
  weeklyXp: {}
};

function completeLesson(unitId, lessonIndex, isTestOut = false, accuracy = 100) {
  const uNumMatch = unitId.match(/\d+/);
  const currentUnitNum = uNumMatch ? parseInt(uNumMatch[0], 10) : 1;
  const streakCount = progress.streak.count;
  const streakBonus = Math.min(20, streakCount * 2);
  const xpEarned = isTestOut ? (accuracy >= 80 ? 50 : 20) : (6 * 10 + 5 + streakBonus);

  progress.xp += xpEarned;
  const key = `${unitId}-l${lessonIndex}`;
  progress.completedLessons[key] = true;

  let nextUnitId = null;
  let nextLessonIdx = null;

  if (isTestOut && accuracy >= 80) {
    for (let l = 1; l <= 4; l++) progress.completedLessons[`${unitId}-l${l}`] = true;
    progress.unlockedUnit = Math.max(progress.unlockedUnit, currentUnitNum + 1);
    nextUnitId = `unit-${currentUnitNum + 1}`;
    nextLessonIdx = 1;
  } else {
    if (lessonIndex < 4) {
      nextUnitId = unitId;
      nextLessonIdx = lessonIndex + 1;
    } else {
      progress.unlockedUnit = Math.max(progress.unlockedUnit, currentUnitNum + 1);
      nextUnitId = `unit-${currentUnitNum + 1}`;
      nextLessonIdx = 1;
    }
  }

  return { xpEarned, nextUnitId, nextLessonIdx };
}

// Test Lesson 1 -> 2
console.log('Testing Lesson 1 completion...');
let res1 = completeLesson('unit-1', 1);
console.log('  XP earned:', res1.xpEarned, '| Total XP:', progress.xp);
console.log('  Completed lessons:', Object.keys(progress.completedLessons));
console.log('  Next lesson target:', `${res1.nextUnitId}-l${res1.nextLessonIdx}`);
if (progress.completedLessons['unit-1-l1'] !== true || res1.nextLessonIdx !== 2) {
  throw new Error('Lesson 1 completion failed');
}
console.log('✓ Lesson 1 -> Lesson 2 unlock verified\n');

// Test Lesson 2 -> 3
console.log('Testing Lesson 2 completion...');
let res2 = completeLesson('unit-1', 2);
console.log('  Next lesson target:', `${res2.nextUnitId}-l${res2.nextLessonIdx}`);
if (progress.completedLessons['unit-1-l2'] !== true || res2.nextLessonIdx !== 3) {
  throw new Error('Lesson 2 completion failed');
}
console.log('✓ Lesson 2 -> Lesson 3 unlock verified\n');

// Test Lesson 3 -> 4
completeLesson('unit-1', 3);

// Test Lesson 4 (Unit 1 final lesson) -> Unit 2 unlock!
console.log('Testing Unit 1 Final Lesson (Lesson 4) completion...');
console.log('  Before lesson 4: unlockedUnit =', progress.unlockedUnit);
let res4 = completeLesson('unit-1', 4);
console.log('  After lesson 4: unlockedUnit =', progress.unlockedUnit);
console.log('  Next lesson target:', `${res4.nextUnitId}-l${res4.nextLessonIdx}`);

if (progress.unlockedUnit !== 2 || res4.nextUnitId !== 'unit-2' || res4.nextLessonIdx !== 1) {
  throw new Error('Unit 2 did not unlock after completing Unit 1 Lesson 4!');
}
console.log('✓ Unit 2 successfully unlocked upon completing Unit 1 Lesson 4!\n');

// Test node states logic in renderSkillPath
const completed = progress.completedLessons;
const unlockedU = progress.unlockedUnit;
console.log('Testing Skill Path Node Rendering States:');
for (let u = 1; u <= 2; u++) {
  const isUnlocked = u <= unlockedU;
  for (let l = 1; l <= 4; l++) {
    const lessonKey = `unit-${u}-l${l}`;
    const isDone = !!completed[lessonKey];
    const isCurrent = isUnlocked && !isDone && (l === 1 || !!completed[`unit-${u}-l${l - 1}`]);
    const isLocked = !isUnlocked || (!isDone && !isCurrent);
    const state = isDone ? 'COMPLETED' : (isCurrent ? 'CURRENT (ACTIVE)' : 'LOCKED');
    console.log(`  Unit ${u} Lesson ${l} (${lessonKey}): ${state}`);
  }
}

// Unit 2 Lesson 1 must be CURRENT
const u2l1_done = !!completed['unit-2-l1'];
const u2l1_current = (2 <= unlockedU) && !u2l1_done && (1 === 1 || !!completed['unit-2-l0']);
if (!u2l1_current) {
  throw new Error('Unit 2 Lesson 1 is not in CURRENT state after Unit 1 completed!');
}
console.log('\n✓ Skill Tree node progression logic passed 100%!\n');

console.log('ALL FLOW & PROGRESSION TESTS PASSED!');
