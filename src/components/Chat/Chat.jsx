import React, { useState, useEffect, useRef, useContext } from "react";
import io from "socket.io-client";
import "./Chat.css"; // Assume you have a CSS file for styles
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-regular-svg-icons";
import SocketContext from "../../SocketContext";
import styled from "styled-components";

export const RowStyle = styled.div`
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr 5fr 1fr 1fr; // Must be identical to BoardWrapper
  gap: 10px; // Adjust the gap to your preference
  width: 100%;
  align-items: center;
  text-align: center;
  padding: 5px 0px; // Add padding to match the BoardWrapper layout
  // rest of your styles
`;

export const BoardWrapper = styled.div`
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr 5fr 1fr; // Must be identical to RowStyle
  gap: 10px; // Adjust the gap to your preference
  width: 100%;
  align-items: center;
  text-align: center;
  padding: 0px 0px; // Add padding to match the BoardWrapper layout
  font-size: 25px;
`;

const getOtherUsername = (roomName, currentUsername) => {
  return roomName.split("--").filter((name) => name !== currentUsername);
};

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const messagesEndRef = useRef(null);

  const searchParams = new URLSearchParams(location.search);
  const room = searchParams.get("room");
  const username = searchParams.get("username");

  useEffect(() => {
    if (socket) {
      socket.on("lobbyUsers", ({ users }) => {
        setUsers(users);
      });

      socket.on("invitationToPrivateChat", ({ room, from, to }) => {
        if (username === to) {
          navigate(`/chat?username=${username}&room=${room}`);
        }
      });

      return () => {
        socket.off("lobbyUsers");
        socket.off("invitationToPrivateChat");
      };
    }
  }, [socket, navigate, username]);

  useEffect(() => {
    if (socket && room && username) {
      socket.emit("joinRoom", { username, room });

      const onRoomUsers = ({ users }) => {
        setUsers(users);
      };

      const onMessage = (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      };

      socket.on("roomUsers", onRoomUsers);
      socket.on("message", onMessage);

      return () => {
        socket.off("roomUsers", onRoomUsers);
        socket.off("message", onMessage);
      };
    }
  }, [socket, room, username]);

  useEffect(() => {
    // Reset states when room changes
    setMessages([]);
    setUsers([]);
    // You can add here other state resets if needed
  }, [room]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message && socket && room) {
      // Include the room name in the message data
      console.log(`Emitting chatMessage: ${message}\nsocket: ${socket.id}`);
      socket.emit("chatMessage", { text: message, room });
      console.log(`chatMessage room: ${room}`);
      setMessage("");
    }
  };

  // Function to initiate private chat
  const initiatePrivateChat = (recipient) => {
    if (username !== recipient) {
      const privateRoomId = [username, recipient].sort().join("--");

      // Navigate the current user (John) to the new private chat room
      navigate(`/chat?username=${username}&room=${privateRoomId}`);

      // Emit an event to invite the other user (Kevin)
      socket.emit("initiatePrivateChat", {
        initiator: username,
        recipient,
        room: privateRoomId,
      });
    }
  };

  const toLobby = () => {
    navigate(`/chat?username=${username}&room=Lobby`);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (socket) {
      // Listening for previousMessages event
      socket.on("previousMessages", (messages) => {
        // Handle the array of room messages
        // For instance, you can set these messages to your state
        setMessages(messages);
      });

      return () => {
        // Clean up the listener when the component unmounts
        socket.off("previousMessages");
      };
    }
  }, [socket]);

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <header className="chat-header">
        <RowStyle>
          <h1>
            <FontAwesomeIcon icon={faPaperPlane} />" Lift
          </h1>
          <div>
            <BoardWrapper>
              <div></div>
            </BoardWrapper>
          </div>
          <button style={{}} onClick={() => toLobby()} className="btn">
            Lobby
          </button>
          <a href="/" className="btn">
            Start
          </a>
        </RowStyle>
      </header>

      {/* Chat Main Section */}
      <main className="chat-main">
        {/* User List */}
        <div className="chat-sidebar">
          <h3>In chat:</h3>
          <ul style={{ marginBottom: "10px" }}>
            <li style={{}} className="btn">
              {getOtherUsername(room, username)}
            </li>
          </ul>
          <h3>Friends:</h3>
          <ul>
            {users.map((user, index) => (
              <li
                key={index}
                className={user.username === username ? "current-user" : ""}
                onClick={() => initiatePrivateChat(user.username)}
              >
                {user.username}
              </li>
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
            '' Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
