'use strict';

const assert = require('assert');
const { formatDate, relativeTime, isLeapYear } = require('../src/date-utils');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    failures.push(`${name}: ${e.message}`);
  }
}

// ==================== formatDate ====================

test('formatDate - 默认格式 YYYY-MM-DD', () => {
  const date = new Date(2024, 0, 15); // 2024-01-15
  const result = formatDate(date);
  assert.strictEqual(result, '2024-01-15');
});

test('formatDate - 自定义格式 YYYY/MM/DD', () => {
  const date = new Date(2024, 0, 15);
  const result = formatDate(date, 'YYYY/MM/DD');
  assert.strictEqual(result, '2024/01/15');
});

test('formatDate - 包含时分秒格式', () => {
  const date = new Date(2024, 0, 15, 8, 5, 3);
  const result = formatDate(date, 'YYYY-MM-DD HH:mm:ss');
  assert.strictEqual(result, '2024-01-15 08:05:03');
});

test('formatDate - 仅时间格式 HH:mm:ss', () => {
  const date = new Date(2024, 5, 20, 14, 30, 45);
  const result = formatDate(date, 'HH:mm:ss');
  assert.strictEqual(result, '14:30:45');
});

test('formatDate - 时间戳输入', () => {
  const timestamp = new Date(2024, 0, 15).getTime();
  const result = formatDate(timestamp, 'YYYY-MM-DD');
  assert.strictEqual(result, '2024-01-15');
});

test('formatDate - 无效 Date 对象', () => {
  const result = formatDate(new Date('invalid'), 'YYYY-MM-DD');
  assert.strictEqual(result, 'Invalid Date');
});

test('formatDate - NaN 时间戳', () => {
  const result = formatDate(NaN, 'YYYY-MM-DD');
  assert.strictEqual(result, 'Invalid Date');
});

test('formatDate - 月份和日期补零', () => {
  const date = new Date(2024, 2, 5); // 2024-03-05
  const result = formatDate(date);
  assert.strictEqual(result, '2024-03-05');
});

// ==================== relativeTime ====================

test('relativeTime - 3秒内返回"刚刚"', () => {
  const result = relativeTime(Date.now() - 2000);
  assert.strictEqual(result, '刚刚');
});

test('relativeTime - 刚好0秒返回"刚刚"', () => {
  const result = relativeTime(Date.now());
  assert.strictEqual(result, '刚刚');
});

test('relativeTime - 60秒内返回"x秒前"', () => {
  const result = relativeTime(Date.now() - 30000);
  assert.strictEqual(result, '30秒前');
});

test('relativeTime - 60分钟内返回"x分钟前"', () => {
  const result = relativeTime(Date.now() - 5 * 60 * 1000);
  assert.strictEqual(result, '5分钟前');
});

test('relativeTime - 24小时内返回"x小时前"', () => {
  const result = relativeTime(Date.now() - 2 * 60 * 60 * 1000);
  assert.strictEqual(result, '2小时前');
});

test('relativeTime - 30天内返回"x天前"', () => {
  const result = relativeTime(Date.now() - 5 * 24 * 60 * 60 * 1000);
  assert.strictEqual(result, '5天前');
});

test('relativeTime - 超过30天返回"x个月前"', () => {
  const result = relativeTime(Date.now() - 60 * 24 * 60 * 60 * 1000);
  assert.strictEqual(result, '2个月前');
});

test('relativeTime - 边界：恰好3秒前返回"刚刚"', () => {
  const result = relativeTime(Date.now() - 3 * 1000);
  assert.strictEqual(result, '刚刚');
});

test('relativeTime - 边界：恰好60秒前返回"60秒前"', () => {
  const result = relativeTime(Date.now() - 60 * 1000);
  assert.strictEqual(result, '60秒前');
});

test('relativeTime - 边界：恰好60分钟前返回"60分钟前"', () => {
  const result = relativeTime(Date.now() - 60 * 60 * 1000);
  assert.strictEqual(result, '60分钟前');
});

test('relativeTime - 边界：恰好24小时前返回"24小时前"', () => {
  const result = relativeTime(Date.now() - 24 * 60 * 60 * 1000);
  assert.strictEqual(result, '24小时前');
});

test('relativeTime - 边界：恰好30天前返回"30天前"', () => {
  const result = relativeTime(Date.now() - 30 * 24 * 60 * 60 * 1000);
  assert.strictEqual(result, '30天前');
});

test('relativeTime - Date 对象输入', () => {
  const date = new Date(Date.now() - 1000);
  const result = relativeTime(date);
  assert.strictEqual(result, '刚刚');
});

test('relativeTime - 无效日期返回"Invalid Date"', () => {
  const result = relativeTime(new Date('invalid'));
  assert.strictEqual(result, 'Invalid Date');
});

test('relativeTime - NaN 时间戳返回"Invalid Date"', () => {
  const result = relativeTime(NaN);
  assert.strictEqual(result, 'Invalid Date');
});

// ==================== isLeapYear ====================

test('isLeapYear - 2024是闰年', () => {
  assert.strictEqual(isLeapYear(2024), true);
});

test('isLeapYear - 2023不是闰年', () => {
  assert.strictEqual(isLeapYear(2023), false);
});

test('isLeapYear - 2000是闰年(能被400整除)', () => {
  assert.strictEqual(isLeapYear(2000), true);
});

test('isLeapYear - 1900不是闰年(能被100整除但不能被400整除)', () => {
  assert.strictEqual(isLeapYear(1900), false);
});

test('isLeapYear - 100不是闰年(能被100整除但不能被400整除)', () => {
  assert.strictEqual(isLeapYear(100), false);
});

test('isLeapYear - 400是闰年(能被400整除)', () => {
  assert.strictEqual(isLeapYear(400), true);
});

test('isLeapYear - 字符串输入返回false', () => {
  assert.strictEqual(isLeapYear('2024'), false);
});

test('isLeapYear - null输入返回false', () => {
  assert.strictEqual(isLeapYear(null), false);
});

test('isLeapYear - undefined输入返回false', () => {
  assert.strictEqual(isLeapYear(undefined), false);
});

test('isLeapYear - NaN输入返回false', () => {
  assert.strictEqual(isLeapYear(NaN), false);
});

module.exports = { passed, failed, failures };
