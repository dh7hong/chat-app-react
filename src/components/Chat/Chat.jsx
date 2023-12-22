import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./Chat.css"; // Assume you have a CSS file for styles
import { useLocation } from "react-router-dom";
import {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} from "../../utils/users";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-regular-svg-icons";
const SERVER = "http://localhost:4000";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const room = searchParams.get("room");
  const username = searchParams.get("username");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SERVER, { query: { username, room } });
    setSocket(newSocket);
    console.log(`Emitting joinRoom for ${username} in room ${room}`);
    newSocket.emit("joinRoom", { username, room });

    newSocket.on("roomUsers", ({ room, users }) => {
      console.log(`Users for room ${room}:`, users);
      setUsers(users);
    });

    newSocket.on("message", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      newSocket.off("roomUsers", { room, users });
      newSocket.off("message");
      newSocket.close();
      newSocket.disconnect();
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message && socket) {
      socket.emit("chatMessage", message);
      setMessage("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <header className="chat-header">
        <h1>ChatCord</h1>
        <a href="/" className="btn">
          Leave Room
        </a>
      </header>

      {/* Chat Main Section */}
      <main className="chat-main">
        {/* User List */}
        <div className="chat-sidebar">
          <h3>Room Name: {room}</h3>
          <h3>Users</h3>
          <ul>
            {users.map((user, index) => (
              <li key={index}>{user.username}</li>
            ))}
          </ul>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.username === username ? "outgoing" : "incoming"
              }`}
            >
              <p className="meta">
                {msg.username} <span>{msg.time}</span>
              </p>
              <p className="text">{msg.text}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Chat Form */}
      <div className="chat-form-container">
        <form onSubmit={sendMessage}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter Message"
            required
            autoComplete="off"
          />
          <button className="btn">
            <FontAwesomeIcon icon={faPaperPlane} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;