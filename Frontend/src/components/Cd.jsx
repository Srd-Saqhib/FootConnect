import React from "react";
import Btn from "./Btn";
import "../styles/Card.css"

function Card(props){
    return <div className="Card" style={{backgroundColor : props.color?props.color:white}}>
        <h3>{props.title}</h3>
        <p>{props.place}</p>
        <p>{props.date}</p>
        <Btn text="Register" color="#1F3897" />
    </div>
}

export default Card;