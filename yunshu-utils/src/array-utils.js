/**
 * array-utils - 数组工具函数
 */

/**
 * 数组去重，保留元素原始顺序
 * @param {Array} arr - 输入数组
 * @returns {Array} 去重后的新数组
 */
function unique(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr)];
}

/**
 * 数组分块
 * @param {Array} arr - 输入数组
 * @param {number} size - 块大小，默认1
 * @returns {Array[]} 分块后的二维数组
 */
function chunk(arr, size = 1) {
  if (!Array.isArray(arr)) return [];
  if (size < 1) return [];
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * 数组扁平化
 * @param {Array} arr - 输入数组
 * @param {number} depth - 扁平化深度，默认1
 * @returns {Array} 扁平化后的数组
 */
function flatten(arr, depth = 1) {
  if (!Array.isArray(arr)) return [];
  return arr.flat(depth);
}

module.exports = { unique, chunk, flatten };
