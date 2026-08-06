const mongoose = require('mongoose');

async function connectDB() {
  mongoose.connection.on('connected', () => {
    console.log(`[MongoDB] Connected: ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[MongoDB] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected');
  });

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = connectDB;
