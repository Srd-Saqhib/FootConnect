import React, { useState, useEffect } from "react";
import axios from "axios";
import Card from "../components/Cd";
import "../styles/Home.css";
import FriendlyCard from "../components/FriendlyCard";

function Home() {
  const [friendlyMatches, setFriendlyMatches] = useState([]);

  useEffect(() => {
    fetchFriendlies();
  }, []);

  async function fetchFriendlies() {
    try {
      const res = await axios.get("/api/friendly");
      setFriendlyMatches(res.data.matches);
    }
    catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="home">
      <div className="title">
        <h1 className="home-title">Welcome to FootConnect</h1>
        <p className="home-subtitle">
          Connect. Play. Grow. Join India's Premier Football Community ⚽
        </p>
      </div>

      <h2 className="section-title">
        Upcoming Friendlies ⚽
      </h2>

      <div className="friendlies-grid">
        {friendlyMatches.length === 0 ? (
          <p>No upcoming friendlies scheduled.</p>
        ) : (
          friendlyMatches.map(match => (
            <FriendlyCard
              key={match.id}
              match={match}
            />
          ))
        )}
      </div>

      <div className="stats">
        <h3>Current Stats</h3>
        <div className="statgroup">
          <div className="sbox">
            <h2>1500+</h2>
            <p>Active player</p>
          </div>
          <div className="sbox">
            <h2>50+</h2>
            <p>Clubs</p>
          </div>
          <div className="sbox">
            <h2>100+</h2>
            <p>Matches</p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Home;
