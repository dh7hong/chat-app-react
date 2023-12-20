const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./src/utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
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
const userConnections = new Map();

io.on("connection", (socket) => {
    // Retrieve username and room from the socket
    const username = socket.handshake.query.username;
    const room = socket.handshake.query.room; // Make sure the client sends 'room' in query

    // Disconnect existing connection if it exists
    if (userConnections.has(username)) {
        const existingSocket = userConnections.get(username);
        existingSocket.disconnect(true);
    }

    // Add the new socket to the map
    userConnections.set(username, socket);

    // Join the user to the room
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatBoard!"));

    // Broadcast when a new user connects
    socket.broadcast.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
    );

    // Update the room's user list
    io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
    });

    // Handle chatMessage event
    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            io.to(user.room).emit("message", formatMessage(user.username, msg));
        }
    });

    // Handle disconnect event
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit(
                "message",
                formatMessage(botName, `${user.username} has left the chat`)
            );
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room),
            });
            userConnections.delete(username);
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
