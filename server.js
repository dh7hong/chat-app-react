const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./src/utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getCurrentUserByUsername,
  userLeaveByName,
  isUserInRoom,
  getAllUsers
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

const botName = "ChatBot";

const emitUpdatedUserList = (room) => {
  io.to(room).emit("roomUsers", {
    room,
    users: getRoomUsers(room),
  });
};

const emitUpdatedLobbyUserList = () => {
  const allUsersIncludingPrivate = getAllUsers(); // Assume this function returns all connected users
  io.to("Lobby").emit("roomUsers", {
    room: "Lobby",
    users: allUsersIncludingPrivate,
  });
};

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const existingUser = getCurrentUser(socket.id);
    console.log(`existingUser: ${JSON.stringify(existingUser)}`);
    console.log(`existingUser.room: ${existingUser?.room}`);
    console.log(`room trying to join: ${room}`);

    // Check if the user is already in the room they are trying to join
    // if (existingUser && existingUser.room === room) {
    //   console.log(`${username} tried to join the same room: ${room}`);
    //   return;
    // }

    // Handle the case when a user switches rooms
    if (existingUser && existingUser.room !== room) {
      // User is switching to a new room
      console.log(
        `${existingUser?.username} is switching to a new room: ${room}`
      );

      // Update the user list in the old room
      io.to(existingUser.room).emit("roomUsers", {
        room: existingUser.room,
        users: getRoomUsers("Lobby"),
      });

      // Now actually leave the old room and then join the new room in the callback
      socket.leave(existingUser.room, () => {
        // Remove the user from the old room in your users array
        userLeave(socket.id);
      });
    }

    // Add or update the user in the new room
    const newUser = userJoin(socket.id, username, room);
    socket.join(newUser.room);

    // Notify others in the new room
    console.log(`newUser Room: ${JSON.stringify(newUser.room)}`);
    socket.broadcast
      .to(newUser.room)
      .emit("message", formatMessage(botName, `${username} has joined.`));

    // Send updated users list to the new room
    // emitUpdatedUserList(room);
    emitUpdatedLobbyUserList();
  });

  // Listen for chatMessage
  socket.on("chatMessage", ({ text, room }) => {
    const user = getCurrentUser(socket.id);
    if (user && user.room === room) {
      io.to(room).emit("message", formatMessage(user.username, text));
    }
  });

  

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has gone offline.`)
      );

      // Send users and room info
      // emitUpdatedUserList(user.room);
      emitUpdatedLobbyUserList();
    }
  });
  socket.on("initiatePrivateChat", ({ initiator, recipient }) => {
    const privateRoomId = [initiator, recipient].sort().join("-");

    // Join the initiator to the private room
    const initiatorUser = getCurrentUserByUsername(initiator);
    if (initiatorUser) {
      initiatorUser.room = privateRoomId; // Update user's room
      socket.to(initiatorUser.id).emit("joinPrivateRoom", privateRoomId);
      emitUpdatedLobbyUserList();
    }

    // Join the recipient to the private room
    const recipientUser = getCurrentUserByUsername(recipient);
    if (recipientUser) {
      recipientUser.room = privateRoomId; // Update user's room
      io.to(recipientUser.id).emit("joinPrivateRoom", privateRoomId);
      emitUpdatedLobbyUserList();
    }
  });
  // socket.on("switchPrivateChat", ({ username, recipient, newRoom }) => {
  //   const currentUserSocket = getCurrentUserByUsername(username)?.id;
  //   const recipientSocket = getCurrentUserByUsername(recipient)?.id;
  //   if (newRoom.includes(recipient) && newRoom.includes(username)) {
  //     // Notify both users to move to the new private chat
  //     io.to(currentUserSocket).emit("updateRoom", { newRoom });
  //     io.to(recipientSocket).emit("updateRoom", { newRoom });
  //   }
  //   if (newRoom.includes(recipient) && !newRoom.includes(username)) {
  //     // Notify recipient to move to the new private chat
  //     io.to(recipientSocket).emit("updateRoom", { newRoom });
  //     io.to(currentUserSocket).emit("updateRoom", { newRoom: "Lobby" });
  //   }
  //   if (newRoom.includes(username) && !newRoom.includes(recipient)) {
  //     // Notify initiating user to move to the new private chat
  //     io.to(currentUserSocket).emit("updateRoom", { newRoom });
  //     io.to(recipientSocket).emit("updateRoom", { newRoom: "Lobby" });
  //   }
  // });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
