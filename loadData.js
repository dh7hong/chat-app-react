// loadData.js
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://dh7hong:UvTQ49llkpDNSphr@chat-app-react.zyrvmsk.mongodb.net/?retryWrites=true&w=majority&appName=chat-app-react';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const dbPath = path.join(__dirname, 'db.json');

async function loadData() {
  try {
    await client.connect();
    const db = client.db('chat-app-react');
    const collection = db.collection('conversations');

    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const conversations = data.conversations;

    await collection.insertMany(conversations);
    console.log('Data loaded successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

loadData();
