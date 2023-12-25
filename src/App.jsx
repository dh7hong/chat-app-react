import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Join from "./components/Join/Join"; // Import your Join component
import Chat from "./components/Chat/Chat"; // Import your Chat component
import SocketProvider from "./SocketProvider";
function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Join />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
