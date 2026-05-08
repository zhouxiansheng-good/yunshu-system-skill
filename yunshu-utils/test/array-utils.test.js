const assert = require('assert');
const { unique, chunk, flatten } = require('../src/array-utils');

let passed = 0;
let failed = 0;
const failures = [];

function test(description, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    failures.push(`${description}: ${e.message}`);
  }
}

// ==================== unique ====================
test('unique - 数字数组去重', () => {
  assert.deepStrictEqual(unique([1, 2, 2, 3, 3]), [1, 2, 3]);
});

test('unique - 字符串数组去重', () => {
  assert.deepStrictEqual(unique(['a', 'b', 'a']), ['a', 'b']);
});

test('unique - 空数组返回空数组', () => {
  assert.deepStrictEqual(unique([]), []);
});

test('unique - 无重复元素返回原数组', () => {
  assert.deepStrictEqual(unique([1, 2, 3]), [1, 2, 3]);
});

test('unique - 非数组输入返回空数组', () => {
  assert.deepStrictEqual(unique(null), []);
  assert.deepStrictEqual(unique(undefined), []);
  assert.deepStrictEqual(unique('abc'), []);
  assert.deepStrictEqual(unique(123), []);
  assert.deepStrictEqual(unique({}), []);
});

test('unique - 保留元素原始顺序', () => {
  assert.deepStrictEqual(unique([3, 1, 2, 1, 3]), [3, 1, 2]);
});

// ==================== chunk ====================
test('chunk - 基本分块', () => {
  assert.deepStrictEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test('chunk - 刚好整除', () => {
  assert.deepStrictEqual(chunk([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
});

test('chunk - size为1每个元素一块', () => {
  assert.deepStrictEqual(chunk([1, 2, 3], 1), [[1], [2], [3]]);
});

test('chunk - size大于数组长度', () => {
  assert.deepStrictEqual(chunk([1, 2, 3], 10), [[1, 2, 3]]);
});

test('chunk - size默认为1', () => {
  assert.deepStrictEqual(chunk([1, 2, 3]), [[1], [2], [3]]);
});

test('chunk - 空数组返回空数组', () => {
  assert.deepStrictEqual(chunk([], 3), []);
});

test('chunk - 非数组输入返回空数组', () => {
  assert.deepStrictEqual(chunk(null, 2), []);
  assert.deepStrictEqual(chunk(undefined, 2), []);
  assert.deepStrictEqual(chunk('abc', 2), []);
  assert.deepStrictEqual(chunk(123, 2), []);
});

test('chunk - size小于1返回空数组', () => {
  assert.deepStrictEqual(chunk([1, 2, 3], 0), []);
  assert.deepStrictEqual(chunk([1, 2, 3], -1), []);
});

// ==================== flatten ====================
test('flatten - 深度1扁平化', () => {
  assert.deepStrictEqual(flatten([1, [2, [3]]], 1), [1, 2, [3]]);
});

test('flatten - 深度Infinity完全扁平化', () => {
  assert.deepStrictEqual(flatten([1, [2, [3]]], Infinity), [1, 2, 3]);
});

test('flatten - 深度默认为1', () => {
  assert.deepStrictEqual(flatten([1, [2, [3]]]), [1, 2, [3]]);
});

test('flatten - 无嵌套数组原样返回', () => {
  assert.deepStrictEqual(flatten([1, 2, 3]), [1, 2, 3]);
});

test('flatten - 空数组返回空数组', () => {
  assert.deepStrictEqual(flatten([]), []);
});

test('flatten - 多层嵌套深度2', () => {
  assert.deepStrictEqual(flatten([1, [2, [3, [4]]]], 2), [1, 2, 3, [4]]);
});

test('flatten - 非数组输入返回空数组', () => {
  assert.deepStrictEqual(flatten(null), []);
  assert.deepStrictEqual(flatten(undefined), []);
  assert.deepStrictEqual(flatten('abc'), []);
  assert.deepStrictEqual(flatten(123), []);
});

test('flatten - 深度0不做扁平化', () => {
  assert.deepStrictEqual(flatten([1, [2, [3]]], 0), [1, [2, [3]]]);
});

console.log(`array-utils: ${passed} passed, ${failed} failed`);

module.exports = { passed, failed, failures };
