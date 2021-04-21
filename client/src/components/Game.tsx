import React, { Fragment, useEffect, useState } from 'react';
import { useParams, useHistory } from "react-router-dom";
import { Button, Col, Container, Row, InputGroup, FormControl, Modal } from "react-bootstrap";
import avatar0 from "../avatars/0.png";
import avatar1 from "../avatars/1.png";
import avatar2 from "../avatars/2.png";
import avatar3 from "../avatars/3.png";
import { GCard } from './GCard';
import { Portrait } from "./Portrait";
import { Crd } from "../types/Crd";
import { Player } from "../types/Player";

export function Game(props: {socket: SocketIOClient.Socket | null;}) {
  const params = useParams<{ roomID: string; }>();
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<Array<Player>>([]);
  const [filtered, setFiltered] = useState(false);
  const history = useHistory();
  const [start, setStart] = useState(false);
  const [lastCard, setLastCard] = useState<Crd>();
  const [deck, setDeck] = useState<Array<Crd>>([]);
  const [turn, setTurn] = useState<string>("");
  const [modal, setModal] = useState(false);
  const [winner, setWinner] = useState("");
  const [avatar, setAvatar] = useState("");
  const [picker,setPicker] = useState(false);
  const colors: { [k: string]: string; } = {
    "red": "#FF5733",
    "blue": "DEEPSKYBLUE",
    "yellow": "GOLD",
    "green": "LIGHTGREEN",
  };
  useEffect(() => {
    if (!props.socket)
      return;
    props.socket.on("playerList", (list: Array<Player>) => {
      console.log(list);
      setFiltered(false);
      setPlayers(list);
    });
    props.socket.on("startGame", () => {
      setStart(true);
    });
    props.socket.on("gameState", (state: { [k: string]: any; deck: Array<Crd>; lastCard: Crd; turn: string; }) => {
      console.log(state);
      setDeck(state.deck);
      setLastCard(state.lastCard);
      setTurn(state.turn);
    });
    props.socket.on("finishGame", (winner: string) => {
      setWinner(winner);
      setModal(true);
      setTimeout(() => history.push("/"), 2000);
    });
    props.socket.on("pickColor",() =>{
      setPicker(true);
    })
  }, [props.socket]);
  useEffect(() => {
    if (filtered || !start)
      return;
    const arr = players.map((val) => val);
    while (arr[0].name !== name) {
      const e = arr.shift();
      if (e)
        arr.push(e);
    }
    setFiltered(true);
    setPlayers(arr);
  }, [players, name, start, filtered]);

  function handleChange(e: { target: HTMLInputElement; }) {
    setName(e.target.value);
  }

  return (
    <div>
      <Modal show={modal} onHide={() => setModal(false)}>
        <Modal.Header>
          <Modal.Title>{winner + " won"}</Modal.Title>
        </Modal.Header>
      </Modal>
      <Modal show={picker}>
        <Modal.Header>
          <Modal.Title>Pick A Color !</Modal.Title>
        </Modal.Header>
        <Modal.Body>
           {
             Object.keys(colors).map((key) => <Button style={{backgroundColor:colors[key]}} onClick={() => {
               props.socket?.emit("pickColor",key);
               setPicker(false);
              }}>{key}</Button>)
           }
        </Modal.Body>
      </Modal>
      <Container>
        <Row>
          <Col>
            <div>
              <h3 className="g-title">Online Uno</h3>
            </div>
          </Col>
        </Row>
        {!start ?
          (
            <Row>
              {players.length !== 0 ?
                (
                  <Col>
                    <Button variant="dark" onClick={() => {
                      props.socket?.emit("leaveRoom");
                      history.push("/");
                    }}> Leave Room</Button>
                    <div className="user-list">
                      {players.map((val, index) => <h1 key={index}>{val.name}</h1>)}
                    </div>
                    <Button variant="dark" onClick={() => props.socket?.emit("startGame")}>Start Game</Button>
                  </Col>
                )
                :
                (
                  <Col className="mx-auto" md="auto">
                    <h3>Choose Your Avatar</h3>
                    <div className="avatar-list">
                      <img src={avatar0} className="avatar-disp" onClick={() => setAvatar(avatar0)} style={avatar === avatar0 ? { outline: "3px solid black" } : { outline: "" }}></img>
                      <img src={avatar1} className="avatar-disp" onClick={() => setAvatar(avatar1)} style={avatar === avatar1 ? { border: "3px solid black" } : { border: "" }}></img>
                      <img src={avatar2} className="avatar-disp" onClick={() => setAvatar(avatar2)} style={avatar === avatar2 ? { border: "3px solid black" } : { border: "" }}></img>
                      <img src={avatar3} className="avatar-disp" onClick={() => setAvatar(avatar3)} style={avatar === avatar3 ? { border: "3px solid black" } : { border: "" }}></img>
                    </div>
                    <InputGroup className="mb-3">
                      <FormControl onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                        aria-label="Recipient's username"
                        aria-describedby="basic-addon2" />
                      <InputGroup.Append>
                        <Button variant="dark" onClick={() => {
                          console.log(params.roomID);
                          props.socket?.emit("joinRoom", params.roomID, name, avatar);
                        }}>Join</Button>
                      </InputGroup.Append>
                    </InputGroup>
                  </Col>
                )}
            </Row>
          )
          :
          (
            <Fragment>
              <Row>
                <Col>
                </Col>
                <Col sm="3">
                  <Portrait avatar={players[2]?.avatar} name={players[2]?.name ? players[2].name : ""} turn={turn.normalize() === players[2]?.name?.normalize()}></Portrait>
                </Col>
                <Col>
                </Col>
              </Row>
              <Row>
                <Col sm="3">
                  <Portrait avatar={players[3]?.avatar} name={players[3]?.name ? players[3].name : ""} turn={turn.normalize() === players[3]?.name?.normalize()}></Portrait>
                </Col>
                <Col>
                  <Container className="game-area">
                    <Row>
                      <Col>
                        <div className="mx-auto card-draw" onClick={() => props.socket?.emit("drawCard")}>
                          <GCard name={"draw"} number={-1}></GCard>
                        </div>
                      </Col>
                      <Col>
                        <div className="mx-auto grave">
                          <GCard number={lastCard?.num} color={lastCard ? colors[lastCard.color] : ""} name={lastCard?.name}></GCard>
                        </div>
                      </Col>
                    </Row>
                  </Container>
                </Col>
                <Col sm="3">
                  <Portrait avatar={players[1]?.avatar} name={players[1]?.name ? players[1].name : ""} turn={turn.normalize() === players[1]?.name?.normalize()}></Portrait>
                </Col>
              </Row>
              <Row>
                <Col>
                <Container className="deck">
                  <Row className="card-list mx-auto">
                    <Col xs="auto">
                      <Portrait avatar={players[0]?.avatar} name={players[0]?.name ? players[0].name : ""} turn={turn.normalize() === players[0]?.name?.normalize()}></Portrait>
                    </Col>
                    <Col>
                      <div id="sc-wrap" className="scroll-wrap" onWheel={(e) => {
                        const element = document.getElementById("sc-wrap");
                        if (element)
                          element.scrollLeft += 1 * e.deltaY;
                      }}>
                        {deck.map((val, index) => <div className="c-slot" onClick={() => {
                          props.socket?.emit("playCard", index);
                        }}><GCard color={colors[val.color]} number={val.num} name={val.name}></GCard></div>)}
                      </div>
                    </Col>
                  </Row>
                </Container>
                </Col>
              </Row>
            </Fragment>
          )}
      </Container>
    </div>
  );
}
