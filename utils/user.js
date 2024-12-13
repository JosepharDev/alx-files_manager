const redisClient = require('./redis');
const dbClient = require('./db');

/**
 * Module dedicated to user utils.
 */
class UserUtils {
  /**
   * Method to query the database and find the user.
   * @param {Object} query - Query object.
   * @returns {Promise<Object>} - User object.
   */
  static async getUser(query) {
    const user = await dbClient.usersCollection.findOne(query);
    return user;
  }

  /**
   * Method to retrieve user ID and key from the request.
   * @param {Object} request - The HTTP request object.
   * @returns {Promise<Object>} - Object containing userId and key.
   */
  static async getUserIdAndKey(request) {
    const obj = { userId: null, key: null };

    const xToken = request.header('X-Token');

    // Check if token exists
    if (!xToken) return obj;

    obj.key = `auth_${xToken}`;
    obj.userId = await redisClient.get(obj.key);

    return obj;
  }
}

module.exports = UserUtils;
