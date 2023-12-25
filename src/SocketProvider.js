// SocketProvider.js
import React, { useState, useEffect } from 'react';
import SocketContext from './SocketContext';
import io from 'socket.io-client';

const SERVER = "http://localhost:4000";

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SERVER);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
