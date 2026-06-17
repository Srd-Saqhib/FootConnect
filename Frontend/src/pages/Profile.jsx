import React, { useEffect, useState } from "react";
import "../styles/profile.css";
import axios from "axios";
import PlaceIcon from '@mui/icons-material/Place';
import EventIcon from "@mui/icons-material/Event";
import DescriptionIcon from "@mui/icons-material/Description";


function Profile({ user, ssr, ssl, logout, setToast }) {
  const [clubCard, setClubCard] = useState("status");
  const [fetchPlayer, setFetchPlayer] = useState([]);
  const [stats, setStats] = useState(null);
  const [descriptionModule, setDescriptionModule] = useState(false);
  const [description, setDescription] = useState("");
  const [bioModule, setBioModule] = useState(false);
  const [bio, setBio] = useState("");

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

    if (user) {
      fetchProfileStats();
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

  async function fetchProfileStats() {
    try {
      const res = await axios.get("/api/profile/stats", {
        params: {
          userId: user.id
        }
      });
      console.log(res.data);
      setStats(res.data.stats);
    } catch (error) {
      console.log(error);
    }
  }

  async function updateDescription() {
    try {

      await axios.put("/api/club/description", {
        userId: user.id,
        description
      });

      await fetchProfileStats();
      setDescriptionModule(false);
      setToast({
        message: "Description updated successfully",
        type: "success"
      });
      setTimeout(() => {
        setToast({ message: "", type: "" });
      }, 3000);
      return;

    } catch (error) {
      console.log(error);
    }
  }

  async function updateBio() {
    try {

      await axios.put("/api/player/bio", {
        userId: user.id,
        bio
      });

      await fetchProfileStats();

      setBio(bio);
      setBioModule(false);

      setToast({
        message: "Bio updated successfully",
        type: "success"
      });

      setTimeout(() => {
        setToast({ message: "", type: "" });
      }, 3000);

    } catch (error) {
      console.log(error);
    }
  }

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
                    {stats?.club_name || "No Club Assigned"}
                  </span>
                </div>

                <div className={isPlayer ? "player-stats" : "profile-stats"}>
                  {isPlayer ? (
                    <>
                      <div>
                        <strong>{stats?.position || "-"}</strong>
                        <span>Position</span>
                      </div>

                      <div>
                        <strong>
                          {stats?.created_at
                            ? new Date(stats.created_at).getFullYear()
                            : "-"}
                        </strong>
                        <span>Member Since</span>
                      </div>

                      <div>
                        <strong>{user.state}</strong>
                        <span>Location</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong>{stats?.players ?? 0}</strong>
                        <span>Players</span>
                      </div>

                      <div>
                        <strong>{stats?.matches ?? 0}</strong>
                        <span>Matches</span>
                      </div>

                      <div>
                        <strong>{stats?.trophies ?? 0}</strong>
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

      {isPlayer && (
        <div className="about-card">

          <div className="description-header">

            <h3>About</h3>

            <button
              className="edit-description-btn"
              onClick={() => {
                setBio(stats?.bio || "");
                setBioModule(true);
              }}
            >
              Edit
            </button>

          </div>

          <p className="about-sub">
            Player biography
          </p>

          <div className="about-content">
            {stats?.bio ? (
              <p>{stats.bio}</p>
            ) : (
              <p className="empty-about">
                No bio has been added yet.
              </p>
            )}
          </div>

        </div>
      )}

      {/* ===== Club Section ===== */}
      {isClub && (
        <>
          <div className="cardSec">
            <button
              className={clubCard === "status" ? "active-card" : ""}
              onClick={() => setClubCard("status")}
            >
              Status
            </button>

            <button
              className={clubCard === "players" ? "active-card" : ""}
              onClick={() => setClubCard("players")}
            >
              Players
            </button>
          </div>

          {clubCard == "status" &&
            <div className="profile-card">
              <h3>Club Information</h3>

              <div className="club-info">

                <div className="club-info-row">
                  <span>
                    <EventIcon
                      sx={{
                        fontSize: 18,
                        verticalAlign: "middle",
                        marginRight: "6px"
                      }}
                    />
                    Founded
                  </span>
                  <strong>{stats?.founded_year ?? "Not Added"}</strong>
                </div>

                <div className="club-info-row">
                  <span>State</span>
                  <strong>{user.state}</strong>
                </div>

                <div className="club-info-row">
                  <span>District</span>
                  <strong>{user.district}</strong>
                </div>

                <div className="club-description">
                  <div className="description-header">
                    <h4>
                      <DescriptionIcon
                        sx={{
                          fontSize: 20,
                          verticalAlign: "middle",
                          marginRight: "6px"
                        }}
                      />
                      Description
                    </h4>

                    <button
                      className="edit-description-btn"
                      onClick={() => {
                        setDescription(stats?.description || "");
                        setDescriptionModule(true);
                      }}
                    >
                      Edit
                    </button>
                  </div>

                  <p>
                    {stats?.description || "No description available."}
                  </p>
                </div>

              </div>
            </div>
          }

          {clubCard == "players" &&
            <div className="profile-card">
              <h3>Players</h3>
              <p className="about-sub">
                Players currently in the club
              </p>

              {fetchPlayer.length == 0 ? (
                <div className="player-row">
                  <p>No players currently in the club</p>
                </div>) : (
                fetchPlayer.map((player) => (
                  <div className="player-row" key={player.user_id}>
                    <div>
                      <h4>{player.player_name}</h4>
                      <small>{player.position}</small>
                    </div>

                    <div className="player-location">
                      📍 {player.state}, {player.district}
                    </div>
                  </div>
                )))}
            </div>
          }

        </>
      )}


      <button className="logout-btn" onClick={logout}>
        Logout
      </button>

      {descriptionModule && (
        <div
          className="modal-overlay"
          onClick={() => setDescriptionModule(false)}
        >
          <div
            className="description-popup"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>Edit Club Description</h2>

            <textarea
              rows="6"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Tell everyone about your club..."
            />

            <div className="popup-actions">
              <button
                className="cancel-btn"
                onClick={() =>
                  setDescriptionModule(false)
                }
              >
                Cancel
              </button>

              <button
                className="save-btn"
                onClick={updateDescription}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {bioModule && (
        <div
          className="modal-overlay"
          onClick={() => setBioModule(false)}
        >

          <div
            className="description-popup"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>Edit Bio</h2>

            <textarea
              rows="6"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell everyone about yourself..."
            />

            <div className="popup-actions">

              <button
                className="cancel-btn"
                onClick={() => setBioModule(false)}
              >
                Cancel
              </button>

              <button
                className="save-btn"
                onClick={updateBio}
              >
                Save
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );

}

export default Profile;
