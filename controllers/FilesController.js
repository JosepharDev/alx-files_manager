const { ObjectId } = require('mongodb');
const mime = require('mime-types');
const Queue = require('bull');
const UserUtils = require('../utils/user');
const basicUtils = require('../utils/file');
const fileUtils = require('../utils/basic');
const dbClient = require('../utils/db');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const fileQueue = new Queue('FileQueue');

class FileController {
  static async postUpload(req, res) {
    const { userId } = await UserUtils.getUserIdAndKey(req);

    if (!basicUtils.isValidId(userId)) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    if (!userId && req.body.type === 'image') {
      await fileQueue.add({});
    }

    const user = await UserUtils.getUser({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const { error: validationError, fileParams } = 
      await fileUtils.validateBody(req);

    if (validationError) {
      return res.status(400).send({ error: validationError });
    }

    if (fileParams.parentId !== 0 && 
        !basicUtils.isValidId(fileParams.parentId)) {
      return res.status(400).send({ error: 'Parent not found' });
    }

    const { error, code, newFile } = 
      await fileUtils.saveFile(userId, fileParams, FOLDER_PATH);

    if (error) {
      if (res.body.type === 'image') {
        await fileQueue.add({ userId });
      }
      return res.status(code).send(error);
    }

    if (fileParams.type === 'image') {
      await fileQueue.add({
        fileId: newFile.id.toString(),
        userId: newFile.userId.toString(),
      });
    }

    return res.status(201).send(newFile);
  }

  static async getShow(req, res) {
    const { id: fileId } = req.params;
    const { userId } = await UserUtils.getUserIdAndKey(req);

    if (!basicUtils.isValidId(userId)) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const user = await UserUtils.getUser({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    if (!basicUtils.isValidId(fileId) || !basicUtils.isValidId(userId)) {
      return res.status(404).send({ error: 'Not found' });
    }

    const result = await fileUtils.getFile({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!result) {
      return res.status(404).send({ error: 'Not Found' });
    }

    const file = await fileUtils.processFile(result);
    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const { userId } = await UserUtils.getUserIdAndKey(req);

    if (!basicUtils.isValidId(userId)) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const user = await UserUtils.getUser({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    let parentId = req.query.parentId || '0';
    if (parentId === '0') {
      parentId = 0;
    }

    let page = Number(req.query.page) || 0;
    if (Number.isNaN(page)) {
      page = 0;
    }

    if (parentId !== 0 && parentId !== '0') {
      if (!basicUtils.isValidId(parentId)) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      parentId = ObjectId(parentId);
      const folder = await fileUtils.getFile({ _id: ObjectId(parentId) });

      if (!folder || folder.type !== 'folder') {
        return res.status(200).send([]);
      }
    }

    const paginationPipeline = [
      { $match: { parentId } },
      { $skip: page * 20 },
      { $limit: 20 },
    ];

    const aggregate = 
      await dbClient.filesCollection.aggregate(paginationPipeline);

    const fileList = [];
    await aggregate.forEach((doc) => {
      const document = fileUtils.processFile(doc);
      fileList.push(document);
    });

    return res.status(200).send(fileList);
  }

}

module.exports = FileController;
