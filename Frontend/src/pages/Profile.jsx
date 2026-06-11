import React, { useEffect, useState } from "react";
import "../styles/profile.css";
import axios from "axios";
import PlaceIcon from '@mui/icons-material/Place';


function Profile({ user, ssr, ssl, logout }) {
  const [clubCard, setClubCard] = useState("status");
  const [fetchPlayer, setFetchPlayer] = useState([]);

  const isPlayer = user?.role === "player";
  const isClub = user?.role === "club";

  useEffect(() => {
    async function getPlayer() {
      try {
        const res = await axios.get(`/api/player/${user.id}`);
        setFetchPlayer(res.data.players);
      } catch (error) {
        console.log(error);
      }
    }

    if (user && isClub) {
      getPlayer();
    }
  }, [user]);

    if (!user) {
    return (
      <div className="profile-empty profile-page ">
        <h2>Step Onto the Pitch ⚽</h2>

        <p>
          Log in to see your player profile, track performance,
          connect with clubs, and showcase your talent.
        </p>

        <div className="empty-actions">
          <button className="primary-btn" onClick={ssl}>Login</button>
          <button className="secondary-btn" onClick={ssr}>Register</button>
        </div>
      </div>
    );
  }


  const skills = [
    { name: "Dribbling", value: 8.5 },
    { name: "Passing", value: 7.8 },
    { name: "Shooting", value: 7.2 },
    { name: "Defense", value: 6.9 },
    { name: "Speed", value: 8.0 },
  ];

  return (
    <div className="profile-page">

      <div className="profile-header-card">
        <div className="profile-left">
          <div className="profile-avatar">
            {user.name?.[0]?.toUpperCase()}
          </div>

          <div className="profile-details">
            <h2 className="profile-name">{user.name}</h2>

            <div className="profile-meta">
              <div className="profile-role">
                {isPlayer ? user.position : "Football Club"}
              </div>

              <span className="dot">•</span>

              <div className="profile-location">
                <PlaceIcon fontSize="small" /> {user.state} - {user.district}
              </div>
            </div>

            {(isPlayer || isClub) && (
              <>
                <div className="current-club">
                  <span className="club-label">
                    {isPlayer ? "Current Club" : "Club Type"}
                  </span>
                  <span className="club-name">
                    {isPlayer ? (user.user_club_name ? user.user_club_name : "no club") : "Professional Football Club"}
                  </span>
                </div>

                <div className="profile-stats">
                  {isPlayer ? (
                    <>
                      <div>
                        <strong>12</strong>
                        <span>Matches</span>
                      </div>
                      <div>
                        <strong>1</strong>
                        <span>Clubs</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong>18</strong>
                        <span>Players</span>
                      </div>
                      <div>
                        <strong>24</strong>
                        <span>Matches</span>
                      </div>
                      <div>
                        <strong>7</strong>
                        <span>Trophies</span>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}


          </div>
        </div>
      </div>

      {/* ===== Skills Section ===== */}
      {isPlayer && (
        <div className="skills-card">
          <h3>Skills & Ratings</h3>
          <p className="skills-sub">
            Ratings provided by match referees and coaches
          </p>

          {skills.map((skill, index) => (
            <div className="skill-row" key={index}>
              <div className="skill-top">
                <span>{skill.name}</span>
                <span className="skill-score">{skill.value}/10</span>
              </div>

              <div className="skill-bar">
                <div
                  className="skill-fill"
                  style={{ width: `${skill.value * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Club Section ===== */}
      {isClub && (
        <>
          <div className="cardSec">
            <button onClick={() => { setClubCard("status") }}>Status</button>
            <button onClick={() => { setClubCard("players") }}>Players</button>
          </div>

          {clubCard == "status" &&
            <div className="skills-card">
              <h3>Squad Strength</h3>
              <p className="skills-sub">
                Overall team performance indicators
              </p>

              {[
                { name: "Attack", value: 8.2 },
                { name: "Midfield", value: 7.6 },
                { name: "Defense", value: 8.0 },
                { name: "Teamwork", value: 8.4 },
                { name: "Fitness", value: 7.9 },
              ].map((skill, index) => (
                <div className="skill-row" key={index}>
                  <div className="skill-top">
                    <span>{skill.name}</span>
                    <span className="skill-score">{skill.value}/10</span>
                  </div>

                  <div className="skill-bar">
                    <div
                      className="skill-fill"
                      style={{ width: `${skill.value * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          }

          {clubCard == "players" &&
            <div className="skills-card">
              <h3>Players</h3>
              <p className="skills-sub">
                Players currently in the club
              </p>

              {fetchPlayer.length == 0 ? (
                <div className="player-row">
                  <p>No players currently in the club</p>
                </div>) : (
                fetchPlayer.map((player) => (
                  <div className="player-row" key={player.user_id}>
                    <h4>{player.player_name}</h4>
                    <p>{player.position}</p>
                    <p>{player.state} - {player.district}</p>
                  </div>
                )))}
            </div>
          }

        </>
      )}


      <button className="logout-btn" onClick={logout}>
        Logout
      </button>

    </div>
  );

}

export default Profile;
