require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const docRoutes = require('./routes/docs');
const searchRoutes = require('./routes/search');
const qaRoutes = require('./routes/qa');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

// routes
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/qa', qaRoutes);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI, { })
  .then(() => {
    console.log('Mongo connected');
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  })
  .catch(err => {
    console.error('Mongo connection error', err);
    process.exit(1);
  });
