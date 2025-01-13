import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import RedisClinet from '../utils/redis';
import DBClinet from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const Xtok = req.headers['x-token'];
    if (!Xtok) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const key = `auth_${Xtok}`;
    const userId = await RedisClinet.get(key);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const {
      name,
      type,
      parentId,
      isPublic = false,
      data,
    } = req.body;

    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).send({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).send({ error: 'Missing data' });
    }
    if (parentId) {
      const retriv = await DBClinet.client.db()
        .collection('files')
        .findOne({ _id: parentId });
      if (!retriv) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (retriv.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    const doc = {
      name,
      type,
      parentId: parentId || 0,
      isPublic, // Correct field name
      userId,
    };

    if (type === 'folder') {
      const result = await DBClinet.client.db()
        .collection('files')
        .insertOne(doc);
      return res.status(201).json({
        id: result.insertedId, // Return the `id` field
        userId,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileId = uuidv4();
    const filePath = path.join(folderPath, fileId);

    try {
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    } catch (err) {
      return res.status(500).json({ error: 'Could not save file locally' });
    }

    doc.localPath = filePath;
    const result = await DBClinet.client.db()
      .collection('files')
      .insertOne(doc);

    return res.status(201).json({
      id: result.insertedId, // Map `_id` to `id`
      userId,
      name,
      type,
      isPublic,
      parentId: parentId || 0,
    });
  }
}

export default FilesController;
