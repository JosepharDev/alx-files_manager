import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.clinet = createClient();
    this.clinet.on('error', (err) => console.log(err));
  }

  isAlive() {
    return this.clinet.connected && this.clinet.ready;
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.clinet.get(key, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async set(key, val, duration) {
    return new Promise((resolve, reject) => {
      this.clinet.setex(key, duration, val, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      this.clinet.del(key, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

const redisClient = new RedisClient();
export default redisClient;
