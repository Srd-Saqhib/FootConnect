import React from "react";
import "../styles/navbar.css"

function Navbar(props) {
  function setPage(value) {
    props.setCurrentPage(value);
  }


  return (
    <div className="navbox">
      <ul className="navstyle">
        <li style={{ color: props.currentPage === "home" ? "#1F3897" : "black" }} onClick={() => setPage("home")}>Home</li>
        <li style={{ color: props.currentPage === "clubs" ? "#1F3897" : "black" }} onClick={() => setPage("clubs")}>Clubs</li>
        <li style={{ color: props.currentPage === "news" ? "#1F3897" : "black" }} onClick={() => setPage("news")}>News</li>
        <li style={{ color: props.currentPage === "community" ? "#1F3897" : "black" }} onClick={() => setPage("community")}>Community</li>
        <li style={{ color: props.currentPage === "profile" ? "#1F3897" : "black" }} onClick={() => setPage("profile")}>Profile</li>
      </ul>
    </div>
  );
}

export default Navbar;
