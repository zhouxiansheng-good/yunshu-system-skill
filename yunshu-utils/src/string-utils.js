/**
 * string-utils - 字符串工具函数模块
 */

/**
 * 将字符串转换为驼峰命名
 * @param {*} str - 输入值
 * @returns {string} 驼峰命名字符串，非字符串输入返回 ''
 */
function camelCase(str) {
  if (typeof str !== 'string') return '';

  return str
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * 截断字符串
 * @param {*} str - 输入值
 * @param {number} maxLen - 最大长度，默认30
 * @param {string} suffix - 后缀，默认'...'
 * @returns {string} 截断后的字符串，非字符串输入返回 ''
 */
function truncate(str, maxLen = 30, suffix = '...') {
  if (typeof str !== 'string') return '';

  if (str.length <= maxLen) return str;

  if (maxLen <= suffix.length) {
    return str.slice(0, maxLen);
  }

  return str.slice(0, maxLen - suffix.length) + suffix;
}

/**
 * 首字母大写
 * @param {*} str - 输入值
 * @returns {string} 首字母大写的字符串，非字符串输入返回 ''
 */
function capitalize(str) {
  if (typeof str !== 'string') return '';
  if (str.length === 0) return '';

  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { camelCase, truncate, capitalize };
