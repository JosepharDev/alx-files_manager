import express from 'express';
import AppController from '../controllers/AppController.js';
import UserController from '../controllers/UsersController.js';
import AuthController from '../controllers/AuthController.js';
import FilesController from '../controllers/FilesController.js';

// Initialize and define all routes
const controllingRouters = (app) => {
  const router = express.Router();
  app.use('/', router);

  // App status routes
  router.get('/status', (req, res) => {
    AppController.getStatus(req, res);
  });

  // User routes
  router.post('/users', (req, res) => {
    UserController.postNew(req, res);
  });

  router.get('/users/me', (req, res) => {
    UserController.getMe(req, res);
  });

  // Authentication routes
  router.get('/connect', (req, res) => {
    AuthController.getConnect(req, res);
  });

  router.get('/disconnect', (req, res) => {
    AuthController.getDisconnect(req, res);
  });

  // File management routes
  router.post('/files', (req, res) => {
    FilesController.postUpload(req, res);
  });

  router.get('/files/:id', (req, res) => {
    FilesController.getShow(req, res);
  });

  router.get('/files', (req, res) => {
    FilesController.getIndex(req, res);
  });

  router.put('/files/:id/publish', (req, res) => {
    FilesController.putPublish(req, res);
  });

  router.put('/files/:id/unpublish', (req, res) => {
    FilesController.putUnpublish(req, res);
  });

  router.get('/files/:id/data', (req, res) => {
    FilesController.getFile(req, res);
  });
};

export default controllingRouters;
