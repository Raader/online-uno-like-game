import React, { useEffect, useState } from 'react';
import './App.css';
import io from "socket.io-client";
import {
  BrowserRouter as Router,
  Switch,
  Route, useParams, useHistory
} from "react-router-dom";
import {Button, Col, Container,Row,InputGroup,FormControl} from "react-bootstrap";

function App() {
  const [socket,setSocket] = useState<SocketIOClient.Socket | null>(null);
  
  useEffect(() =>{
    const socket = io("http://localhost:5000/");
    
    setSocket(socket);
    return function cleanup(){
      socket?.close()
    }
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
      <Container fluid>
        <Row>
          <Col>
          <div>
          <h1>ONLINE UNO</h1>
          </div>
          </Col>
        </Row>
        <Row>
          <Col className="mx-auto" md="auto">
          <InputGroup className="mb-3">
          <FormControl
          placeholder="Room ID"
          aria-label="Recipient's username"
          aria-describedby="basic-addon2"
          />
          <InputGroup.Append>
          <Button variant="outline-dark">Join</Button>
          </InputGroup.Append>
          </InputGroup>
          </Col>
        </Row>
        <Row className="mx-auto">
          <Col md="3" className="mx-auto" >
          <h2>OR</h2>
          <Button variant="outline-dark" onClick={() => {
            props.socket?.emit("createRoom")
          }}>Create Room</Button>
          </Col>
        </Row>
      </Container>
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
      <Container fluid>
        <Row>
          <Col>
          <div>
          <h1>Game</h1>
          </div>
          </Col>
        </Row>
        <Row>
          {players.length !== 0 ?
          (
          <Col>
          <Button variant="outline-dark" onClick={() =>{
            props.socket?.emit("leaveRoom");
            history.push("/");
          }}> Leave Room</Button>
          <div className="user-list">
            {players.map((val,index) => <h1 key={index}>{val}</h1>)}
          </div>
          </Col>
          )
          : 
          (
          <Col className="mx-auto" md="auto">
          <InputGroup className="mb-3">
          <FormControl onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          aria-label="Recipient's username"
          aria-describedby="basic-addon2"
          />
          <InputGroup.Append>
          <Button variant="outline-dark" onClick={() =>{
            console.log(params.roomID);
            props.socket?.emit("joinRoom",params.roomID,name);
          }}>Join</Button>
          </InputGroup.Append>
          </InputGroup>
          </Col>
          )
          }
        </Row>
      </Container>
    </div>
  )
}
export default App;
