import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.isConnected = true;

    this.client = createClient();

    this.client.on('error', (err) => {
      this.isConnected = false;
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      this.isConnected = true;
    });
  }

  isAlive() {
    return this.isConnected;
    /* client.ping()
      .then(() => true)
      .catch(() => false);
      */
  }

  /**
   * @param key {String}
   * @returns {Promise<any>}
   */
  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  /**
   * @param key {String}
   * @param value {any}
   * @param duration {number}
   * @returns {Promise<any>}
   */
  async set(key, value, duration) {
    return new Promise((_, reject) => {
      this.client.set(key, value, (err) => {
        if (err) reject(err);

        this.client.expire(key, duration, (err) => {
          if (err) reject(err);
        });
      });
    });
  }

  /**
   * @param key {String}
   * @returns {Promise<void>}
   */
  async del(key) {
    return new Promise((_, reject) => {
      this.client.del(key, (err) => {
        if (err) reject(err);
      });
    });
  }
}

const redisClient = new RedisClient();
export default redisClient;
