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


io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room, isInitialJoin }) => {
    const existingUser = getCurrentUser(socket.id);
    console.log(`existingUser: ${JSON.stringify(existingUser)}`);
    console.log(`existingUser.room: ${existingUser?.room}`);
    console.log(`room trying to join: ${room}`);

    // Check if the user is already in the room they are trying to join
    if (existingUser && existingUser.room === room) {
      console.log(`${username} tried to join the same room: ${room}`);
      return;
    }

    // Handle the case when a user switches rooms
    if (existingUser && existingUser.room !== room) {
      // User is switching to a new room
      console.log(
        `${existingUser?.username} is switching to a new room: ${room}`
      );
    
      // Update the user list in the old room
      io.to(existingUser.room).emit("roomUsers", {
        room: existingUser.room,
        users: getRoomUsers(existingUser.room).filter(
          (u) => u.id !== socket.id
        ),
      });
    
      // Now actually leave the old room and then join the new room in the callback
      socket.leave(existingUser.room, () => {
        // Remove the user from the old room in your users array
        userLeave(socket.id);
    
        // Add or update the user in the new room
        const newUser = userJoin(socket.id, username, room);
        socket.join(newUser.room);
    
        // Rest of the code for joining the new room...
      });
    }

    // Add or update the user in the new room
    const newUser = userJoin(socket.id, username, room);
    socket.join(newUser.room);

    // Send a welcome message only on initial join
    if (isInitialJoin) {
      socket.emit("message", formatMessage(botName, "Welcome to ChatBoard!"));
    }

    // Notify others in the new room
    socket.broadcast
      .to(newUser.room)
      .emit(
        "message",
        formatMessage(botName, `${username} has joined the chat`)
      );

    // Send updated users list to the new room
    io.to(newUser.room).emit("roomUsers", {
      room: newUser.room,
      users: getRoomUsers(newUser.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    }
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });

  // Handling private chat initiation

  socket.on("initiatePrivateChat", ({ initiator, recipient, room }) => {
    const recipientUser = getCurrentUserByUsername(recipient);
    if (recipientUser) {
      io.to(recipientUser.id).emit("privateChatInvitation", {
        from: initiator,
        room,
      });
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
