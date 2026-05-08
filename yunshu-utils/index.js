const stringUtils = require('./src/string-utils');
const dateUtils = require('./src/date-utils');
const arrayUtils = require('./src/array-utils');

module.exports = {
  ...stringUtils,
  ...dateUtils,
  ...arrayUtils
};
