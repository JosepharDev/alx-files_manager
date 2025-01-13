import { createHash } from 'crypto';
import { ObjectId } from 'mongodb';
import DBClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    if (email) {
      const response = await DBClient.client.db().collection('users').findOne({ email });
      if (response) {
        return res.status(400).send({ error: 'Already exist' });
      }
      const shap = createHash('sha1');
      const hasPass = shap.update(password).digest('hex');
      const doc = {
        email,
        password: hasPass,
      };
      const result = await DBClient.client.db().collection('users').insertOne(doc);
      return res.status(201).send({ id: result.insertedId, email });
    }
    return 0;
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const kkey = `auth_${token}`;
    const result = await redisClient.get(kkey);
    if (result) {
      const data = await DBClient.client.db()
        .collection('users')
        .findOne({ _id: ObjectId(result) });
      return res.send({ id: data._id, email: data.email });
    }
    return res.status(401).send({ error: 'Unauthorized' });
  }
}
export default UsersController;
