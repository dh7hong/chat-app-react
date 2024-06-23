// src/utils/messages.js
const { connectToDatabase } = require('./mongoClient');

async function readMessages() {
  const db = await connectToDatabase();
  const conversations = await db.collection('conversations').find().toArray();
  return conversations;
}

async function writeMessages(conversations) {
  const db = await connectToDatabase();
  await db.collection('conversations').deleteMany({});
  await db.collection('conversations').insertMany(conversations);
}

async function addMessage(newMessage) {
  const db = await connectToDatabase();
  await db.collection('conversations').insertOne(newMessage);
}

module.exports = {
  readMessages,
  writeMessages,
  addMessage
};
