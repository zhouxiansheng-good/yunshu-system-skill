const assert = require('assert');
const { camelCase, truncate, capitalize } = require('../src/string-utils');

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

// ==================== camelCase ====================

test('camelCase: 空格分隔转驼峰', () => {
  assert.strictEqual(camelCase('hello world'), 'helloWorld');
});

test('camelCase: 短横线分隔转驼峰', () => {
  assert.strictEqual(camelCase('foo-bar-baz'), 'fooBarBaz');
});

test('camelCase: 下划线分隔转驼峰', () => {
  assert.strictEqual(camelCase('foo_bar_baz'), 'fooBarBaz');
});

test('camelCase: 混合分隔符转驼峰', () => {
  assert.strictEqual(camelCase('foo-bar_baz qux'), 'fooBarBazQux');
});

test('camelCase: 单个单词', () => {
  assert.strictEqual(camelCase('hello'), 'hello');
});

test('camelCase: 空字符串', () => {
  assert.strictEqual(camelCase(''), '');
});

test('camelCase: 非字符串输入返回空字符串 - 数字', () => {
  assert.strictEqual(camelCase(123), '');
});

test('camelCase: 非字符串输入返回空字符串 - null', () => {
  assert.strictEqual(camelCase(null), '');
});

test('camelCase: 非字符串输入返回空字符串 - undefined', () => {
  assert.strictEqual(camelCase(undefined), '');
});

test('camelCase: 非字符串输入返回空字符串 - 对象', () => {
  assert.strictEqual(camelCase({}), '');
});

test('camelCase: 连续分隔符', () => {
  assert.strictEqual(camelCase('foo--bar'), 'fooBar');
});

test('camelCase: 大写输入转小写驼峰', () => {
  assert.strictEqual(camelCase('HELLO-WORLD'), 'helloWorld');
});

// ==================== truncate ====================

test('truncate: 超长截断加默认后缀', () => {
  assert.strictEqual(truncate('hello world', 8), 'hello...');
});

test('truncate: 不超长不截断', () => {
  assert.strictEqual(truncate('hello', 30), 'hello');
});

test('truncate: 刚好等于maxLen不截断', () => {
  assert.strictEqual(truncate('hello', 5), 'hello');
});

test('truncate: 自定义后缀', () => {
  assert.strictEqual(truncate('hello world', 9, '---'), 'hello ---');
});

test('truncate: 空字符串', () => {
  assert.strictEqual(truncate('', 30), '');
});

test('truncate: 非字符串输入返回空字符串 - 数字', () => {
  assert.strictEqual(truncate(123, 30), '');
});

test('truncate: 非字符串输入返回空字符串 - null', () => {
  assert.strictEqual(truncate(null, 30), '');
});

test('truncate: 非字符串输入返回空字符串 - undefined', () => {
  assert.strictEqual(truncate(undefined, 30), '');
});

test('truncate: maxLen小于后缀长度直接截断不加后缀', () => {
  assert.strictEqual(truncate('hello world', 2), 'he');
});

test('truncate: maxLen等于后缀长度直接截断不加后缀', () => {
  assert.strictEqual(truncate('hello world', 3), 'hel');
});

test('truncate: 默认参数', () => {
  const longStr = 'a'.repeat(31);
  assert.strictEqual(truncate(longStr), 'a'.repeat(27) + '...');
});

// ==================== capitalize ====================

test('capitalize: 首字母大写', () => {
  assert.strictEqual(capitalize('hello'), 'Hello');
});

test('capitalize: 多单词仅首字母大写', () => {
  assert.strictEqual(capitalize('hello world'), 'Hello world');
});

test('capitalize: 空字符串', () => {
  assert.strictEqual(capitalize(''), '');
});

test('capitalize: 已大写不变', () => {
  assert.strictEqual(capitalize('Hello'), 'Hello');
});

test('capitalize: 单字符', () => {
  assert.strictEqual(capitalize('a'), 'A');
});

test('capitalize: 非字符串输入返回空字符串 - 数字', () => {
  assert.strictEqual(capitalize(123), '');
});

test('capitalize: 非字符串输入返回空字符串 - null', () => {
  assert.strictEqual(capitalize(null), '');
});

test('capitalize: 非字符串输入返回空字符串 - undefined', () => {
  assert.strictEqual(capitalize(undefined), '');
});

test('capitalize: 非字符串输入返回空字符串 - 数组', () => {
  assert.strictEqual(capitalize([]), '');
});

// ==================== 导出结果 ====================

module.exports = { passed, failed, failures };
