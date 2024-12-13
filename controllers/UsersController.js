const { ObjectId } = require('mongodb');
const sha1 = require('sha1');
const dbClient = require('../utils/db');
const UserUtils = require('../utils/user');

class UserController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const existingEmail = await dbClient.usersCollection.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Already exists' });
    }

    const encryptedPassword = sha1(password);

    try {
      const newUser = { email, password: encryptedPassword };
      const result = await dbClient.usersCollection.insertOne(newUser);

      return res.status(201).json({ id: result.insertedId, email });
    } catch (err) {
      console.error('Error creating new user:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
    try {
      const { userId } = await UserUtils.getUserIdAndKey(req);

      const user = await UserUtils.getUser({
        _id: ObjectId(userId),
      });

      if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const processedUser = { id: user._id, ...user };
      delete processedUser._id;
      delete processedUser.password;

      return res.status(200).send(processedUser);
    } catch (err) {
      console.error('Error retrieving user information:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UserController;
