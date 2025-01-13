import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.isConnect = false;
    this.client.connect()
      .then(() => {
        this.isConnect = true;
      })
      .catch((err) => {
        console.error(err);
        this.isConnect = false;
      });
  }

  isAlive() {
    return this.isConnect;
  }

  async nbUsers() {
    try {
      const db = this.client.db();
      const userCollection = db.collection('users');
      return await userCollection.countDocuments();
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  async nbFiles() {
    try {
      const db = this.client.db();
      const fileCollection = db.collection('files');
      return await fileCollection.countDocuments();
    } catch (err) {
      console.error(err);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
