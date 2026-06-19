import React, { useState, useEffect } from "react";
import axios from "axios";
import Card from "../components/Cd";
import "../styles/Home.css";
import FriendlyCard from "../components/FriendlyCard";
import TournamentCard from "../components/TournamentCard";

function Home(props) {
  const [friendlyMatches, setFriendlyMatches] = useState([]);
  const [tournamentMatches, setTournamentMatches] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchFriendlies();
    fetchTournament();
    fetchStats();
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

  async function fetchTournament() {
    try {
      const res = await axios.get("/api/tournament");
      setTournamentMatches(res.data.tournaments);
    }
    catch (error) {
      console.log(error);
    }
  }

  async function fetchStats() {
    try {

      const res = await axios.get("/api/home/stats");

      setStats(res.data);

    } catch (error) {
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
        Upcoming Tournaments 🏆
      </h2>

      <div className="friendlies-grid">
        {tournamentMatches.length === 0 ? (
          <p>No tournaments available.</p>
        ) : (
          tournamentMatches.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              openTournament={props.openTournament}
              clubId={props.currentUser.user_club_id}
            />
          ))
        )}
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

        <h3>Community Statistics</h3>

        <div className="statgroup">

          <div className="sbox">
            <h2>{stats.players ?? 0}</h2>
            <p>Registered Players</p>
          </div>

          <div className="sbox">
            <h2>{stats.clubs ?? 0}</h2>
            <p>Registered Clubs</p>
          </div>

          <div className="sbox">
            <h2>{stats.tournaments ?? 0}</h2>
            <p>Active Tournaments</p>
          </div>

          <div className="sbox">
            <h2>{stats.friendlies ?? 0}</h2>
            <p>Friendly Matches</p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Home;
