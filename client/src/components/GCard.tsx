import { CircleSlashIcon } from '@primer/octicons-react';
import React from 'react';

export function GCard(props: { color?: string; number?: Number; name?: string; }) {
  return (
    <div className="mx-auto gcard" style={props.color ? { borderColor: props.color, color: props.color } : {}}>
      {props.name !== "skip" ?
        <h1>{props.number && props.number <= 0 ? props.name : props.number}</h1>
        :
        <h1><CircleSlashIcon size={42}></CircleSlashIcon></h1>
        }
    </div>
  );
}
