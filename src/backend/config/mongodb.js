const mongoose = require('mongoose');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// MongoDB connection URI
const mongoURI = 'mongodb://127.0.0.1:27017/lactokeeper';


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