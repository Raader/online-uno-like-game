import React, { useEffect, useState } from 'react';
import './App.css';
import io from "socket.io-client";

function App() {
  const [socket,setSocket] = useState<SocketIOClient.Socket | null>(null);
  useEffect(() =>{
    const socket = io("http://localhost:5000/");
    setSocket(socket);
  },[])
  return (
    <div className="App">
      <h1>hello</h1>
    </div>
  );
}

export default App;
