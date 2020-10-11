import React, { Fragment } from 'react';
import { Col, Container, Row } from "react-bootstrap";


export function Portrait(props: { name?: string; turn: boolean; avatar?: string; }) {
  return (
    <Container className="port-cont">
      <Row>
        <Col>
          <div className="mx-auto portrait" style={props.turn ? { borderColor: "greenyellow" } : {}}>
            {props.avatar ? <img src={props.avatar}></img> : <Fragment></Fragment>}
          </div>
        </Col>
      </Row>
      <Row>
        <div className="mx-auto">
          <h4>{props.name}</h4>
        </div>
      </Row>
    </Container>
  );
}
