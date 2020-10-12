import { ArrowSwitchIcon, CircleSlashIcon } from '@primer/octicons-react';
import React, { useEffect, useState } from 'react';

export function GCard(props: { color?: string; number?: Number; name?: string; }) {
  const [ico,setIco] = useState(<h1>{props.number && props.number <= 0 ? props.name : props.number}</h1>)
  useEffect(() =>{
    if(props.name === "skip"){
      setIco(<h1><CircleSlashIcon size={42}></CircleSlashIcon></h1>);
    }
    else if(props.name === "direction"){
      setIco(<h1><ArrowSwitchIcon size={42}></ArrowSwitchIcon></h1>)
    }
    else{
      setIco(<h1>{props.number && props.number <= 0 ? props.name : props.number}</h1>);
    }
  },[props])
  return (
    <div className="mx-auto gcard" style={props.color ? { borderColor: props.color, color: props.color } : {}}>
      {ico}
    </div>
  );
}
