import React from "react";
import "../styles/button.css";

function Btn({ text, color = "#c0c6deff", onClick }) {
  return (
    <button
      className="btn"
      style={{ backgroundColor: color, color: "white" }}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

export default Btn;