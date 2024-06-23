const fs = require("fs");
const path = require("path");
const moment = require("moment");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("../src/utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllUsers,
} = require("../src/utils/users");
const { MongoClient } = require('mongodb');
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*", // For development. Set to your frontend's URL in production
    methods: ["GET", "POST"],
  },
});

const uri = 'mongodb+srv://dh7hong:UvTQ49llkpDNSphr@chat-app-react.zyrvmsk.mongodb.net/?retryWrites=true&w=majority&appName=chat-app-react';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

async function connectToDatabase() {
  if (!db) {
    try {
      await client.connect();
      db = client.db('chat-app-react');
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error(err);
    }
  }
  return db;
}

app.use(cors()); // Enable CORS

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

const emitUpdatedLobbyUserList = () => {
  const usersInLobby = getAllUsers(); // Assume this function returns all connected users
  io.emit("lobbyUsers", {
    users: usersInLobby,
  });
};

io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ username, room }) => {
    const joinResult = userJoin(socket.id, username, room);

    if (!joinResult.alreadyInRoom) {
      socket.leave(joinResult.previousRoom);
      socket.join(joinResult.room);

      io.to(joinResult.room).emit(
        "message",
        formatMessage("Chatbot", `${username} has joined`)
      );

      emitUpdatedLobbyUserList();

      try {
        const messages = await readMessages();
        const roomMessages = messages.filter(
          (message) => message.room === room
        );
        socket.emit("previousMessages", roomMessages);
      } catch (err) {
        console.error(err);
      }
    }
  });

  socket.on("initiatePrivateChat", ({ initiator, recipient }) => {
    const privateRoomId = [initiator, recipient].sort().join("--");
    socket.join(privateRoomId);

    socket.broadcast.emit("invitationToPrivateChat", {
      room: privateRoomId,
      from: initiator,
      to: recipient,
    });
    emitUpdatedLobbyUserList();
  });

  socket.on("chatMessage", async ({ text, room }) => {
    const sender = getCurrentUser(socket.id);
    if (!sender || sender.room !== room) {
      return;
    }

    const usersInRoom = getRoomUsers(room);
    usersInRoom.forEach((user) => {
      io.to(user.id).emit("message", formatMessage(sender.username, text));
    });

    if (sender && sender.room === room) {
      const newMessage = {
        username: sender.username,
        text: text,
        time: moment().format("MM/DD/YY, hh:mm A"),
        room: room,
      };
      try {
        await addMessage(newMessage);
        console.log(`Message added: ${newMessage.text}`);
      } catch (err) {
        console.error(err);
      }
    }
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage("Chatbot", `${user.username} has left the chat`)
      );
      emitUpdatedLobbyUserList();
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
