import React, { useState, useEffect, useRef, useContext } from "react";
import io from "socket.io-client";
import "./Chat.css"; // Assume you have a CSS file for styles
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} from "../../utils/users";
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
  padding: 10px 0px; // Add padding to match the BoardWrapper layout
  font-size: 25px;
`;

const SERVER = "http://localhost:4000";

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false); // State for showing/hiding the modal
  const [modalContent, setModalContent] = useState({ from: "", room: "" }); // Content of the modal

  const location = useLocation();
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const messagesEndRef = useRef(null);

  const searchParams = new URLSearchParams(location.search);
  const room = searchParams.get("room");
  const username = searchParams.get("username");

  const handleAcceptInvitation = () => {
    if (modalContent) {
      const privateRoomId = [username, modalContent.from].sort().join("-");
      // Emit joinRoom event with new room details
      socket.emit("joinRoom", { username, room: privateRoomId });

      // Navigate to the new chat room
      navigate(`/chat?username=${username}&room=${privateRoomId}`);

      // Close the modal
      setShowModal(false);
    }
  };

  // Function to handle declining the invitation
  const handleDeclineInvitation = () => {
    setShowModal(false); // Hide the modal when declining the invitation
  };

  useEffect(() => {
    if (socket && room && username) {
      socket.emit("joinRoom", { username, room, isInitialJoin: true });

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
    if (socket) {
      console.log("Setting up listener for private chat invitations");
      socket.on("privateChatInvitation", onPrivateChatInvitation);
      return () => {
        console.log("Removing listener for private chat invitations");
        socket.off("privateChatInvitation", onPrivateChatInvitation);
      };
    }
  }, [socket]);

  const onPrivateChatInvitation = ({ from, room }) => {
    console.log(
      `Received private chat invitation from ${from} for room ${room}`
    );
    setModalContent({ from, room });
    setShowModal(true);
  };

  useEffect(() => {
    // Reset states when room changes
    setMessages([]);
    setUsers([]);
    // You can add here other state resets if needed
  }, [room]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message && socket) {
      socket.emit("chatMessage", message);
      console.log(`Emitting chatMessage: ${message}\nsocket: ${socket.id}`);
      setMessage("");
    }
  };

  // Function to initiate private chat
  const initiatePrivateChat = (recipient) => {
    if (username !== recipient) {
      // Generate a consistent room name
      const privateRoomId = [username, recipient].sort().join("-");
      socket.emit("initiatePrivateChat", {
        initiator: username,
        recipient,
        room: privateRoomId,
      });
      navigate(`/chat?username=${username}&room=${privateRoomId}`);
    }
  };

  const toLobby = () => {
    navigate(`/chat?username=${username}&room=Lobby`);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <header className="chat-header">
        <RowStyle>
          <h1><FontAwesomeIcon icon={faPaperPlane} />" Lift</h1>
          <a>
            <BoardWrapper>
              <div></div>
              {showModal && (
                <div className="invitation-modal">
                  <p>
                    {`${modalContent.from} wants to chat! `}

                    <button
                      style={{ margin: "0px 10px" }}
                      className="btn"
                      onClick={handleAcceptInvitation}
                    >
                      Accept
                    </button>

                    <button className="btn" onClick={handleDeclineInvitation}>
                      Decline
                    </button>
                  </p>
                </div>
              )}
            </BoardWrapper>
          </a>
          <a style={{}} onClick={() => toLobby()} className="btn">
            To Lobby
          </a>
          <a href="\" className="btn">
            To Beginning
          </a>
        </RowStyle>
      </header>

      {/* Chat Main Section */}
      <main className="chat-main">
        {/* User List */}
        <div className="chat-sidebar">
          <h3>Room:</h3>
          <ul>
            <li style={{}} className="btn">
              {room.replace(username, "").replace("-", "")}
            </li>
          </ul>
          <h3>Users</h3>
          <ul>
            {users.map((user, index) => (
              <li
                key={index}
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

// Helper function to generate a random room ID
const generateRandomId = () => {
  let date = new Date();
  let milliseconds =
    date.getHours() * 60 * 60 * 1000 +
    date.getMinutes() * 60 * 1000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds();
  return milliseconds;
};
