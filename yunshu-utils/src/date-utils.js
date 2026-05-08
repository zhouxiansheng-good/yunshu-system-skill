'use strict';

/**
 * 将输入转换为 Date 对象
 * @param {Date|number} date - Date 对象或时间戳
 * @returns {Date|null} 有效的 Date 对象或 null
 */
function toDate(date) {
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof date === 'number') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * 左侧补零
 * @param {number} num
 * @param {number} len
 * @returns {string}
 */
function padZero(num, len) {
  return String(num).padStart(len, '0');
}

/**
 * 格式化日期
 * @param {Date|number} date - Date 对象或时间戳
 * @param {string} format - 格式字符串，默认 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串，无效日期返回 'Invalid Date'
 */
function formatDate(date, format) {
  const d = toDate(date);
  if (!d) return 'Invalid Date';

  format = format || 'YYYY-MM-DD';

  const tokens = {
    YYYY: padZero(d.getFullYear(), 4),
    MM: padZero(d.getMonth() + 1, 2),
    DD: padZero(d.getDate(), 2),
    HH: padZero(d.getHours(), 2),
    mm: padZero(d.getMinutes(), 2),
    ss: padZero(d.getSeconds(), 2),
  };

  let result = format;
  // 按长度降序替换，避免短 token 先匹配导致长 token 被部分替换
  const orderedKeys = Object.keys(tokens).sort((a, b) => b.length - a.length);
  for (const key of orderedKeys) {
    result = result.replace(new RegExp(key, 'g'), tokens[key]);
  }

  return result;
}

/**
 * 相对时间描述
 * @param {Date|number} date - Date 对象或时间戳
 * @returns {string} 相对时间字符串，无效日期返回 'Invalid Date'
 */
function relativeTime(date) {
  const d = toDate(date);
  if (!d) return 'Invalid Date';

  const now = Date.now();
  const target = d.getTime();
  const diff = now - target; // 毫秒差，正数表示过去

  const absDiff = Math.abs(diff);
  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (seconds <= 3) return '刚刚';
  if (seconds <= 60) return seconds + '秒前';
  if (minutes <= 60) return minutes + '分钟前';
  if (hours <= 24) return hours + '小时前';
  if (days <= 30) return days + '天前';
  return months + '个月前';
}

/**
 * 判断闰年
 * @param {number} year - 年份
 * @returns {boolean} 是否为闰年，非数字输入返回 false
 */
function isLeapYear(year) {
  if (typeof year !== 'number' || isNaN(year)) return false;
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

module.exports = { formatDate, relativeTime, isLeapYear };
