import React, { useEffect, useState } from 'react';
import './App.css';
import io from "socket.io-client";
import {
  BrowserRouter as Router,
  Switch,
  Route, useParams, useHistory
} from "react-router-dom";

function App() {
  const [socket,setSocket] = useState<SocketIOClient.Socket | null>(null);
  
  useEffect(() =>{
    const socket = io("http://localhost:5000/");
    
    setSocket(socket);
  },[])
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

type SocketProps = {
  socket:SocketIOClient.Socket | null;
}

function Home(props:SocketProps) {
  const history = useHistory();
  useEffect(() =>{
    if(!props.socket) return;
    props.socket.on("createRoom",(id:string) =>{
      history.push("/" + id);
    })
  },[props.socket])
  return (
    <div>
      <h1>Home</h1>
      <div>
        <button onClick={() => {
          props.socket?.emit("createRoom")
      }}>Create Room</button>
      </div>
      <div>
        <input placeholder="room id"></input>
        <button>Join Room</button>
      </div>
    </div>
  )
}



function Game(props:SocketProps) {
  const params = useParams<{roomID:string}>();
  const [name,setName] = useState("");
  const [players,setPlayers] = useState<Array<string>>([]);
  const history = useHistory();
  useEffect(() =>{
    if(!props.socket) return;
    props.socket.on("playerList",(list:Array<string>) => {
      setPlayers(list);
    });
  },[props.socket])

  function handleChange(e: { target: HTMLInputElement; }){
    setName(e.target.value)
  }

  return (
    <div>
      <h1>Game</h1>
      <div>
        {players.map(val => <h1>{val}</h1>)}
      </div>
      <button onClick={() => {
        props.socket?.emit("leaveRoom");
        history.push("/");
    }}>Leave Room</button>
      <input placeholder="name" value={name} onChange={handleChange}></input>
      <button onClick={() =>{
        console.log(params.roomID);
        props.socket?.emit("joinRoom",params.roomID,name);
      }}>Join Room</button>
    </div>
  )
}
export default App;
