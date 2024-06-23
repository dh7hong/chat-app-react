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

const dbPath = path.join(__dirname, "db.json");

app.use(cors()); // Enable CORS

// Read messages from db.json
function readMessages() {
  return new Promise((resolve, reject) => {
    fs.readFile(dbPath, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      let jsonData = JSON.parse(data || "{}");
      resolve(jsonData.conversations || []);
    });
  });
}

// Write messages to db.json
function writeMessages(conversations) {
  let dataToWrite = JSON.stringify({ conversations }, null, 2);
  return new Promise((resolve, reject) => {
    fs.writeFile(dbPath, dataToWrite, "utf8", (err) => {
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

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const joinResult = userJoin(socket.id, username, room);

    if (!joinResult.alreadyInRoom) {
      socket.leave(joinResult.previousRoom);
      socket.join(joinResult.room);

      io.to(joinResult.room).emit(
        "message",
        formatMessage("Chatbot", `${username} has joined`)
      );

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
    socket.join(privateRoomId);

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
      addMessage(newMessage)
        .then(() => {
          console.log(`Message added: ${newMessage.text}`);
        })
        .catch((err) => console.error(err));
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
