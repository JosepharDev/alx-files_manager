
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * Method that gets database status
   * @param {*} req
   * @param {*} res
   * @return {object}
   */
  static getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).send(status);
  }

  /**
   * Method that gets database statistics
   * @param {*} req
   * @param {*} res
   * @return {object}
   */
  static async getStat(req, res) {
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    res.status(200).send(stats);
  }
}

export default AppController;
