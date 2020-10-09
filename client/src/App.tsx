import React, { Fragment, useEffect, useState } from 'react';
import './App.css';
import io from "socket.io-client";
import {
  BrowserRouter as Router,
  Switch,
  Route, useParams, useHistory
} from "react-router-dom";
import { Button, Col, Container, Row, InputGroup, FormControl} from "react-bootstrap";

function App() {
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);

  useEffect(() => {
    const socket = process.env.NODE_ENV === "production" ? io() : io("http://localhost:5000/");
    document.body.style.backgroundColor = "#b1412e";
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

type SocketProps = {
  socket: SocketIOClient.Socket | null;
}

function Home(props: SocketProps) {
  const history = useHistory();
  useEffect(() => {
    if (!props.socket) return;
    props.socket.on("createRoom", (id: string) => {
      history.push("/" + id);
    })
  }, [props.socket])
  return (
    <div>
      <Container fluid>
        <Row>
          <Col>
            <div className="header">
              <h1>ONLINE UNO</h1>
            </div>
          </Col>
        </Row>
        <Row>
          <Col className="mx-auto" md="auto">
            <InputGroup className="mb-3">
              <FormControl style={{ backgroundColor: "rgba(245, 245, 245, 0.589)" }}
                placeholder="Room ID"
                aria-label="Recipient's username"
                aria-describedby="basic-addon2"
              />
              <InputGroup.Append>
                <Button variant="dark">Join</Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
        </Row>
        <Row className="mx-auto">
          <Col md="3" className="mx-auto" >
            <h2>OR</h2>
            <Button variant="dark" onClick={() => {
              props.socket?.emit("createRoom")
            }}>Create Room</Button>
          </Col>
        </Row>
      </Container>
    </div>
  )
}


interface Crd{
  name:string;
  color:string;
  num:Number;
}
function Game(props: SocketProps) {
  const params = useParams<{ roomID: string }>();
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<Array<string>>([]);
  const [filtered,setFiltered] = useState(false);
  const history = useHistory();
  const [start, setStart] = useState(false)
  const [lastCard,setLastCard] = useState<Crd>();
  const [deck,setDeck] = useState<Array<Crd>>([]);
  const [turn,setTurn] = useState<string>("");
  const colors:{[k:string]:string;} = {
    "red" : "#FF5733",
    "blue":"DEEPSKYBLUE",
    "yellow":"GOLD",
    "green":"LIGHTGREEN"
  }
  useEffect(() => {
    if (!props.socket) return;
    props.socket.on("playerList", (list: Array<string>) => {
      console.log(list);
      setFiltered(false);
      setPlayers(list);
    });
    props.socket.on("startGame", () => {    
      setStart(true);
    });
    props.socket.on("gameState",(state:{[k:string]:any; deck:Array<Crd>; lastCard:Crd; turn:string;}) =>{
      console.log(state);
      setDeck(state.deck);
      setLastCard(state.lastCard);
      setTurn(state.turn);
    });
    props.socket.on("finishGame",(winner:string) =>{
      history.push("/");
    })
  }, [props.socket]);
  useEffect(() =>{
    if(!filtered) return;
    const arr = players.map((val) => val);
    while(arr[0] !== name){
      const e = arr.shift();
      arr.push(e ? e : "");
    }
    setFiltered(true);
    setPlayers(arr);
  },[players,name,start,filtered])

  function handleChange(e: { target: HTMLInputElement; }) {
    setName(e.target.value)
  }

  return (
    <div>
      <Container>
        <Row>
          <Col>
            <div>
              <h1>Game</h1>
            </div>
          </Col>
        </Row>
        {!start ?
          (
            <Row>
              {players.length !== 0 ?
                (
                  <Col>
                    <Button variant="outline-dark" onClick={() => {
                      props.socket?.emit("leaveRoom");
                      history.push("/");
                    }}> Leave Room</Button>
                    <div className="user-list">
                      {players.map((val, index) => <h1 key={index}>{val}</h1>)}
                    </div>
                    <Button variant="outline-dark" onClick={() => props.socket?.emit("startGame")}>Start Game</Button>
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
                        <Button variant="outline-dark" onClick={() => {
                          console.log(params.roomID);
                          props.socket?.emit("joinRoom", params.roomID, name);
                        }}>Join</Button>
                      </InputGroup.Append>
                    </InputGroup>
                  </Col>
                )
              }
            </Row>
          )
          :
          (
            <Fragment>
              <Row>
                <Col>
                </Col>
                <Col>
                  <Portrait name={players[2] ? players[2] : ""} turn={turn.normalize() === players[2]?.normalize()}></Portrait>
                </Col>
                <Col>
                </Col>
              </Row>
              <Row>
                <Col md="3">
                  <Portrait name={players[3] ? players[3] : ""} turn={turn.normalize() === players[3]?.normalize()}></Portrait>
                </Col>
                <Col>
                  <Container className="game-area">
                    <Row>
                      <Col className="mx-auto">
                        <div className="mx-auto grave">
                          <GCard number={lastCard?.num} color={lastCard ? colors[lastCard.color] : ""} name={lastCard?.name}></GCard>
                        </div>
                      </Col>
                    </Row>
                  </Container>
                </Col>
                <Col md="3">
                  <Portrait name={players[1] ? players[1] : ""} turn={turn.normalize() === players[1]?.normalize()}></Portrait>     
                </Col >
              </Row>
              <Row>
                <Col>
                </Col>
                <Col>
                  <Portrait name={players[0] ? players[0] : ""} turn={turn.normalize() === players[0]?.normalize()}></Portrait>
                </Col>
                <Col>
                </Col>
              </Row>
              <Row>
              <Container className="deck">
                <Row className="card-list mx-auto">
                  {
                    deck.map((val,index) => <div className="c-slot" onClick={() =>{
                      props.socket?.emit("playCard",index);
                    }}><GCard color={colors[val.color]} number={val.num} name={val.name}></GCard></div>)
                  }
                </Row>
              </Container>
              <Row>
                <Col className="mx-auto">
                  <Button variant="dark"  onClick={() => props.socket?.emit("drawCard")}>Draw a card</Button>
                  <Button variant="danger">Pass</Button>
                </Col>
              </Row>
              </Row>
            </Fragment>
          )
        }
      </Container>
    </div>
  )
}


function Portrait(props:{name?:string;turn:boolean}){
  return(
    <Container className="port-cont">
      <Row>
        <Col>
          <div className="mx-auto portrait" style={props.turn ? {borderColor:"green"} : {}}>
      
          </div>
        </Col>
      </Row>
      <Row>
        <div className="mx-auto">
          <h4>{props.name}</h4>
        </div>
      </Row>
    </Container>
  )
}
function GCard(props:{color?:string;number?:Number;name?:string}){
  return(
    <div className="mx-auto gcard" style={props.color ? {borderColor:props.color,color:props.color} : {}}>
      <h1>{props.number && props.number <= 0 ? props.name : props.number}</h1>
    </div>
  )
}

export default App;
