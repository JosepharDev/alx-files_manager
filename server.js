import express from 'express';
import router from './routes/index';

const app = express();
const PortListen = process.env.PORT || 5000;
app.use(express.json());
app.use('/', router);

const server = app.listen(PortListen, () => {
  console.log('Server running on port', PortListen);
});

process.on('SIGINT', () => {
  console.log('shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
