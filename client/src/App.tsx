import React, { useEffect, useState } from 'react';
import './App.css';
import io, { Socket } from "socket.io-client";
import {
  BrowserRouter as Router,
  Switch,
  Route} from "react-router-dom";
import { Game } from './components/Game';
import { Home } from './components/Home';

function App() {
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);

  useEffect(() => {
    const socket = process.env.NODE_ENV === "production" ? io() : io("http://localhost:5000/");
    document.body.style.backgroundColor = "#f4c430";
    setSocket(socket);
    return function cleanup() {
      socket?.close()
    }
  }, [])
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/:roomID">
            <Game socket={socket}></Game>
          </Route>
          <Route path="/">
            <Home socket={socket}></Home>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
