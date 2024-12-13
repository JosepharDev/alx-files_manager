const { ObjectId } = require('mongodb');

/**
 * Module with basic utils
 */

const basicUtils = {
  /**
   * check id is valid for mongo
   * @id {string|number} id to be evaluated
   * @return {boolean} true if valid, false if not
   */

  isValid(id) {
    try {
      if (ObjectId(id)) {
        return true;
      }
    } catch (err) {
      return false;
    }
    return false;
  },
};

module.exports = basicUtils;
