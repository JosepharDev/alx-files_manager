require('dotenv').config();
const controllingRoutes = require('./routes/index.js');
const express = require('express');
const helmet = require('helmet');
const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(express.json());

controllingRoutes(app);

app.listen(port, (err) => {
  if (err) {
    console.error('Failed to start the server:', err);
  } else {
    console.log(`Server is running on port ${port}`);
  }
});

// Error logging middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = app;
