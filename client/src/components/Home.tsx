import React, { useEffect } from 'react';
import { useHistory } from "react-router-dom";
import { Button, Col, Container, Row, InputGroup, FormControl } from "react-bootstrap";

export function Home(props: {socket: SocketIOClient.Socket | null;}) {
  const history = useHistory();
  useEffect(() => {
    if (!props.socket)
      return;
    props.socket.on("createRoom", (id: string) => {
      history.push("/" + id);
    });
  }, [props.socket]);
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
                aria-describedby="basic-addon2" />
              <InputGroup.Append>
                <Button variant="dark">Join</Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
        </Row>
        <Row className="mx-auto">
          <Col md="3" className="mx-auto">
            <h2>OR</h2>
            <Button variant="dark" onClick={() => {
              props.socket?.emit("createRoom");
            }}>Create Room</Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
