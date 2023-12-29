const fs = require("fs");
const path = require("path");
const moment = require("moment");

const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./src/utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllUsers,
} = require("./src/utils/users");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*", // For development. Set to your frontend's URL in production
    methods: ["GET", "POST"],
  },
});

const dbPath = path.join(__dirname, "db_chat.json");

function readMessages() {
  return new Promise((resolve, reject) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      let jsonData = JSON.parse(data || '{}');
      resolve(jsonData.conversations || []);
    });
  });
}

function writeMessages(conversations) {
  let dataToWrite = JSON.stringify({ conversations }, null, 2);
  return new Promise((resolve, reject) => {
    fs.writeFile(dbPath, dataToWrite, 'utf8', err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

async function addMessage(newMessage) {
  const conversations = await readMessages();
  conversations.push(newMessage);
  return await writeMessages(conversations);
}

const emitUpdatedLobbyUserList = () => {
  const usersInLobby = getAllUsers(); // Assume this function returns all connected users
  io.emit("lobbyUsers", {
    users: usersInLobby,
  });
};

const dateTime = moment().format("MM/DD/YY, hh:mm A");

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const joinResult = userJoin(socket.id, username, room);

    if (!joinResult.alreadyInRoom) {
      console.log(
        `Check if the user, ${joinResult.username}, is already in the room.`
      );

      // Leave the previous room if different from the current one
      if (
        joinResult.previousRoom &&
        joinResult.previousRoom !== joinResult.room
      ) {
        socket.leave(joinResult.previousRoom);
      }

      socket.join(joinResult.room);
      console.log(
        `Notify the room that a new user, ${joinResult.username}, has joined.`
      );

      // Notify the room that a new user has joined
      io.to(joinResult.room).emit(
        "message",
        formatMessage("Chatbot", `${username} has joined`)
      );

      // Update the lobby user list
      emitUpdatedLobbyUserList();

      readMessages()
        .then((messages) => {
          const roomMessages = messages.filter(
            (message) => message.room === room
          );
          socket.emit("previousMessages", roomMessages);
        })
        .catch((err) => console.error(err));
    }
  });
  socket.on("initiatePrivateChat", ({ initiator, recipient }) => {
    const privateRoomId = [initiator, recipient].sort().join("--");

    // Join the initiator to the private room
    socket.join(privateRoomId);

    // Notify the recipient to join the private room
    socket.broadcast.emit("invitationToPrivateChat", {
      room: privateRoomId,
      from: initiator,
      to: recipient,
    });
    emitUpdatedLobbyUserList();
  });

  socket.on("chatMessage", ({ text, room }) => {
    const sender = getCurrentUser(socket.id);
    if (!sender || sender.room !== room) {
      // If the sender is not in the specified room, do not broadcast the message
      return;
    }

    // Get all users in the room
    const usersInRoom = getRoomUsers(room);

    // Check if the recipient is in the same room as the sender
    usersInRoom.forEach((user) => {
      // Emit message to each user in the room including the sender
      io.to(user.id).emit("message", formatMessage(sender.username, text));
    });

    if (sender && sender.room === room) {
      const newMessage = {
        username: sender.username,
        text: text,
        time: dateTime,
        room: room,
      };
      addMessage(newMessage)
        .then(() => {
          console.log(`Message added: ${JSON.stringify(newMessage).text}`);
        })
        .catch((err) => console.error(err));
    }
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      console.log(`${user.username} has disconnected`);

      // Any additional logic that needs to be executed when a user disconnects
      // For example, notifying other users in the same room
      io.to(user.room).emit(
        "message",
        formatMessage("Chatbot", `${user.username} has left the chat`)
      );

      // Update the lobby user list
      emitUpdatedLobbyUserList();
    } else {
      console.log("A user disconnected, but was not found in the user list");
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
