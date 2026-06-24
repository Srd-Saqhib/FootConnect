import React, { useState, useEffect } from "react";
import api from "../api";
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
      const res = await api.get("/api/friendly");
      setFriendlyMatches(res.data.matches);
    }
    catch (error) {
      console.log(error);
    }
  }

  async function fetchTournament() {
    try {
      const res = await api.get("/api/tournament");
      setTournamentMatches(res.data.tournaments);
    }
    catch (error) {
      console.log(error);
    }
  }

  async function fetchStats() {
    try {

      const res = await api.get("/api/home/stats");

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
          <div className="empty-section">
            <div className="empty-icon">🏆</div>

            <h3>No Tournaments Yet</h3>

            <p>
              There are currently no active tournaments.
              Check back later or create one to get started.
            </p>
          </div>
        ) : (
          tournamentMatches.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              openTournament={props.openTournament}
              clubId={props.currentUser ? props.currentUser.user_club_id : null}
            />
          ))
        )}
      </div>

      <h2 className="section-title">
        Upcoming Friendlies ⚽
      </h2>

      <div className="friendlies-grid">
        {friendlyMatches.length === 0 ? (
          <div className="empty-section">
            <div className="empty-icon">⚽</div>

            <h3>No Friendly Matches</h3>

            <p>
              No matches are scheduled right now.
              Invite another club and organize your first friendly.
            </p>
          </div>
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
