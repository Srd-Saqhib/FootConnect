import React from "react";
import "../styles/navbar.css"
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

function setPage(path) {
  navigate(path);
}

  return (
    <div className="navbox">
      <ul className="navstyle">
        <li style={{ color: location.pathname === "/" ? "#1F3897" : "black" }} onClick={() => setPage("/")}>Home</li>
        <li style={{ color: location.pathname === "/clubs" ? "#1F3897" : "black" }} onClick={() => setPage("/clubs")}>Clubs</li>
        <li style={{ color: location.pathname === "/news" ? "#1F3897" : "black" }} onClick={() => setPage("/news")}>News</li>
        <li style={{ color: location.pathname === "/community" ? "#1F3897" : "black" }} onClick={() => setPage("/community")}>Community</li>
        <li style={{ color: location.pathname === "/profile" ? "#1F3897" : "black" }} onClick={() => setPage("/profile")}>Profile</li>
      </ul>
    </div>
  );
}

export default Navbar;
