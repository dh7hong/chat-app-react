// src/utils/mongoClient.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://dh7hong:UvTQ49llkpDNSphr@chat-app-react.zyrvmsk.mongodb.net/?retryWrites=true&w=majority&appName=chat-app-react'; // Use your connection string
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

async function connectToDatabase() {
  if (!db) {
    try {
      await client.connect();
      db = client.db('chat-app-react'); // Replace with your database name
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error(err);
    }
  }
  return db;
}

module.exports = { connectToDatabase };
