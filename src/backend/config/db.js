const mongoose = require('mongoose');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// MongoDB connection URI
const mongoURI = 'mongodb://127.0.0.1:27017/lactokeeper';

// Function to start MongoDB
const startMongoDB = () => {
  return new Promise((resolve, reject) => {
    const mongodCommand = `"C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe" --dbpath "${dbPath}"`;

    exec(mongodCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting MongoDB: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`MongoDB stderr: ${stderr}`);
      }
      console.log(`MongoDB started: ${stdout}`);
      resolve();
    });
  });
};


// Function to connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');

    // Create admin user if it doesn't exist

  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      console.log('MongoDB is not running. Attempting to start...');
      try {
        await startMongoDB();
        // Retry connection after starting MongoDB
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
        await connectDB();
      } catch (startError) {
        console.error('Failed to start MongoDB:', startError);
        process.exit(1);
      }
    } else {
      console.error('Error connecting to MongoDB:', error);
      process.exit(1);
    }
  }
};

// Export the connection function
module.exports = connectDB;