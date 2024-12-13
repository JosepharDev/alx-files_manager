const { ObjectId } = require('mongodb');
const { v4: uuid4 } = require('uuid');
const { promises: fsPromises } = require('fs');
const dbClient = require('./db');
const basicUtils = require('./basic');

const fileUtils = {
  /**
   * Validates if body is Valid for creating file
   * @param {object} request - Express request object
   * @return {object} - Object with error and validate params
   */
  async validateBody(request) {
    const {
      name, type, isPublic = false, data,
    } = request.body;

    // Extract parentId from the request.body
    const { parentId = 0 } = request.body;

    const typeAllowed = ['file', 'image', 'folder'];
    let msg = null;

    if (!name) {
      msg = 'Missing name';
    } else if (!type || !typeAllowed.includes(type)) {
      msg = 'Missing type';
    } else if (!data && type !== 'folder') {
      msg = 'Missing type';
    } else if (parentId && parentId !== '0') {
      let file;

      if (basicUtils.isValid(parentId)) {
        file = await dbClient.filesCollection.findOne(
          { _id: ObjectId(parentId) },
        );
      } else {
        file = null;
      }

      if (!file) {
        msg = 'Parent not found';
      } else if (file.type !== 'folder') {
        msg = 'Parent is not a folder';
      }
    }

    const obj = {
      error: msg,
      fileParams: {
        name,
        type,
        parentId,
        isPublic,
        data,
      },
    };

    return obj;
  },

  /**
   * Saves files to database and disk
   * param {string} userId - ID of the user
   * param {object} fileParams - Object with attributes of file
   * param {string} FOLDER_PATH - Path to save file
   * return {Object} - Object with error if present
   */
  async saveFile(userId, fileParams, FOLDER_PATH) {
    const {
      name, type, isPublic, data,
    } = fileParams;
    let { parentId } = fileParams;

    if (parentId !== 0) parentId = ObjectId(parentId);

    const query = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId,
    };

    if (fileParams.type !== 'folder') {
      const fileNameUUID = uuid4();

      const fileDataDecoded = Buffer.from(data, 'base64');

      const path = `${FOLDER_PATH}/${fileNameUUID}`;
      query.localPath;

      try {
        await fsPromises.mkdir(FOLDER_PATH, { recursive: true });
        await fsPromises.writeFile(path, fileDataDecoded);
      } catch (err) {
        return { error: err.message, code: 400 };
      }
    }

    const result = await dbClient.fileCollection.insertOne(query);
    const file = this.processFile(query);
    const newFile = { id: result.insertedId, ...file };

    return { error: null, newFile };
  },

  /**
   * Process the files and remove path
   * transform _id into id in file document
   * param {object} docs - Document to be processed
   * return {Object} - document processed
   */
  processFile(doc) {
    const file = { id: doc._id, ...doc };

    delete file.localPath;
    delete file._id;

    return file;
  },

  /**
   * Update a file document in database
   * @query {obj} query to find document
   * @set {obj} object with query information to update in mongo
   * return {Object} - updated file
   */
  async updateFile(query, set) {
    const fileList = await dbClient.filesCollection.findOneAndUpdate(
      query,
      set,
      { returnOriginal: false },
    );
    return fileList;
  },

  /**
   * Method to get files data
   * @file file document
   * @size size to append
   * return data
   */
  async fileData(file, size) {
    let { localPath } = file;
    let data;

    if (size) localPath = `${localPath}_${size}`;

    try {
      data = await fsPromises.readFile(localPath);
    } catch (error) {
      return { error: 'Not found', code: 404 };
    }

    return { data };
  },
};

module.exports = fileUtils;
