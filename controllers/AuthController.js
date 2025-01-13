import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import DBClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authheader = req.headers.authorization;
    if (!authheader) {
      return res.status(401).send({ error: 'You aren\'t authenticated' });
    }
    let decoded;
    try {
      // Attempt to decode Base64
      decoded = Buffer.from(authheader.split(' ')[1], 'base64').toString('utf-8');
    } catch (err) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const Auth = decoded.split(':');
    if (Auth.length !== 2) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const email = Auth[0];
    const password = Auth[1];
    const haspass = createHash('sha1').update(password).digest('hex');
    const result = await DBClient.client.db()
      .collection('users')
      .findOne({ email, password: haspass });
    if (!result) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    if (result.email === email && result.password === haspass) {
      const uid = uuidv4();
      const KeyToken = `auth_${uid}`;
      await redisClient.set(KeyToken, result._id.toString(), 86400);
      return res.status(200).send({ token: uid });
    }
    return res.status(401).send({ error: 'Unauthorized' });
  }

  static async getDisconnect(req, res) {
    const obj = { userId: null, key: null };
    const Xtok = req.headers['x-token'];
    if (!Xtok) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    obj.key = `auth_${Xtok}`;
    obj.userId = await redisClient.get(obj.key);
    if (!obj.userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    await redisClient.del(obj.key);
    return res.status(204).send();
  }
}

export default AuthController;
