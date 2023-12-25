import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Join.css"; // Your custom CSS
import io from "socket.io-client";
import SocketContext from "../../SocketContext";

const SERVER = "http://localhost:4000";

function Join() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("Lobby");
  const navigate = useNavigate();
  //   const socket = io(SERVER);
  const socket = useContext(SocketContext);

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handleRoomChange = (event) => {
    setRoom(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    socket.emit("joinRoom", { username, room });
    console.log(
      `Emitting joinRoom for ${username}\nin room ${room}\nsocket: ${socket.id}`
    );
    navigate(`/chat?username=${username}&room=${room}`);
  };

  return (
    <div className="join-container">
      <header className="join-header">
        <h1>
          <i className="fas fa-smile"></i> ChatCord
        </h1>
      </header>
      <main className="join-main">
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="Enter username..."
              required
              value={username}
              onChange={handleUsernameChange}
            />
          </div>
          <div className="form-control">
            <label htmlFor="room">Room</label>
            <select
              name="room"
              id="room"
              value={room}
              onChange={handleRoomChange}
            >
              <option value="Lobby">Lobby</option>
            </select>
          </div>
          <button type="submit" className="btn">
            Join Chat
          </button>
        </form>
      </main>
    </div>
  );
}

export default Join;
