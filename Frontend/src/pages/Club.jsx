import React, { useState, useEffect } from "react";
import MessageIcon from '@mui/icons-material/Message';
import CancelIcon from '@mui/icons-material/Cancel';
import NotificationsIcon from '@mui/icons-material/Notifications';
import api from "../api";
import Btn from "../components/Btn";
import "../styles/club.css";
import { useRef } from "react";

function Clubs(props) {
  const [localClubs, setLocalClubs] = useState([]);
  const [stateClubs, setStateClubs] = useState([]);
  const [nationalClubs, setNationalClubs] = useState([]);
  const [joinResult, setJoinResult] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [description, setDescription] = useState("");
  const [followedClubs, setFollowedClubs] = useState([]);
  const [opponentClub, setOpponentClub] = useState("");
  //tournment states
  const [tournamentTitle, setTournamentTitle] = useState("");
  const [tournamentLocation, setTournamentLocation] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxTeams, setMaxTeams] = useState("");
  const [tournamentDescription, setTournamentDescription] = useState("");
  

  useEffect(() => {
    if (props.currentUser) {
      getClub();
    } else {
      getNationalClubs();
    }
  }, [props.currentUser]);

  useEffect(() => {
    if (props.currentUser?.role === "club") {
      getFollowedClub();
    }
  }, [props.currentUser]);


  async function getClub() {
    const result = await api.get("/api/clubs", {
      params: {
        state: props.currentUser.state,
        district: props.currentUser.district,
        userId: props.currentUser.id
      }
    });
    setLocalClubs(result.data.local);
    setStateClubs(result.data.state);
    setNationalClubs(result.data.national);
    console.log("CURRENT USER", props.currentUser);
  }

  async function getNationalClubs() {
    const result = await api.get("/api/clubs");
    setNationalClubs(result.data.national);
  }


  function viewClub(clubId) {
    props.openClub(clubId);
  }

  async function getFollowedClub() {
    try {
      const res = await api.get(`/api/club/followed/${props.currentUser.user_club_id}`);
      setFollowedClubs(res.data.clubs);
    }
    catch (error) {
      console.log(error);
    }
  }

  async function createFriendly() {
    try {
      console.log("CREATE FRIENDLY CLICKED");
      await api.post("/api/friendly/create", {
        userId: props.currentUser.id,
        hostClubId: props.currentUser.user_club_id,
        opponentClubId: opponentClub,
        title,
        location,
        matchDate,
        description
      });
      setModalType(null);
      setTitle("");
      setLocation("");
      setMatchDate("");
      setDescription("");
      setOpponentClub("");

      alert("Friendly request sent!");
    }
    catch (error) {
      console.log(error.response?.data);
      alert(error.response?.data?.message);
    }
  }

  async function createTournament() {
    try {
      await api.post("/api/tournament/create", {
        hostClubId: props.currentUser.user_club_id,
        title: tournamentTitle,
        description: tournamentDescription,
        location: tournamentLocation,
        registrationDeadline,
        startDate,
        endDate,
        maxTeams
      });

      alert("Tournament created!");
      setModalType(null);
      setTournamentTitle("");
      setTournamentLocation("");
      setTournamentDescription("");
      setRegistrationDeadline("");
      setStartDate("");
      setEndDate("");
      setMaxTeams("");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to create tournament");
    }
  }

  return (
    <div className="clubs-page">

      {props.currentUser?.role === "club" && (
        <div className="club-actions">
          <div className="action-card club-action-card">
            <h3>⚽ Create Friendly</h3>
            <p>Challenge another club to a friendly match.</p>
            {followedClubs.length > 0 ? (
              <button onClick={() => setModalType("friendly")}>
                Create
              </button>
            ) : (
              <p className="empty-follow">
                👥 Follow another club to unlock friendly matches.
              </p>
            )}
          </div>

          <div className="action-card club-action-card">
            <h3>🏆 Host Tournament</h3>
            <p>Organize a tournament and invite clubs.</p>
            <button onClick={() => setModalType("tournament")}>
              Host
            </button>
          </div>
        </div>
      )}

      {modalType === "friendly" && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="friendly-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Friendly Match</h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Match Title"
            />

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
            />

            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
            />
            <select
              value={opponentClub}
              onChange={(e) => setOpponentClub(Number(e.target.value))}
            >
              <option value="">Select Opponent Club</option>

              {followedClubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.club_name}
                </option>
              ))}
            </select>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              rows={4}
              placeholder="Description"
            />

            <div className="modal-actions">
              <button onClick={() => setModalType(null)}>
                Cancel
              </button>

              <button onClick={createFriendly}>
                Create Match
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === "tournament" && (
        <div
          className="modal-overlay"
          onClick={() => setModalType(null)}
        >
          <div
            className="friendly-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>🏆 Host Tournament</h2>

            <input
              value={tournamentTitle}
              onChange={(e) => setTournamentTitle(e.target.value)}
              placeholder="Tournament Name"
            />

            <input
              value={tournamentLocation}
              onChange={(e) => setTournamentLocation(e.target.value)}
              placeholder="Location"
            />

            <div className="form-section">
              <span className="section-label">Registration Deadline</span>

              <input
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
              />
            </div>

            <div className="form-row">

              <div className="form-section">
                <span className="section-label">Start Date</span>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-section">
                <span className="section-label">End Date</span>

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

            </div>

            <div className="form-section">
              <span className="section-label">Tournament Size</span>

              <select
                value={maxTeams}
                onChange={(e) => setMaxTeams(Number(e.target.value))}
              >
                <option value="">Choose Size</option>
                <option value={4}>4 Teams</option>
                <option value={8}>8 Teams</option>
                <option value={16}>16 Teams</option>
                <option value={32}>32 Teams</option>
              </select>
            </div>

            <textarea
              rows={4}
              maxLength={200}
              value={tournamentDescription}
              onChange={(e) => setTournamentDescription(e.target.value)}
              placeholder="Tournament Description"
            />

            <div className="modal-actions">
              <button onClick={() => setModalType(null)}>
                Cancel
              </button>

              <button onClick={createTournament}>
                Host Tournament
              </button>
            </div>

          </div>
        </div>
      )}

      {props.currentUser && <div>
        {/* Nearby Clubs */}
        <h1 className="page-title">Nearby Clubs - {props.currentUser.district}</h1>
        <div className="clubs-grid">
          {localClubs.length === 0 ? (

            <div className="empty-clubs">
              <div className="empty-clubs-icon">⚽</div>

              <h3>No Nearby Clubs</h3>

              <p>
                There are currently no registered clubs in your district.
              </p>
            </div>

          ) : (
            localClubs.map((club) => (
              <div className="club-box" key={club.id}>
                <div className="club-header">
                  <h3>{club.club_name}</h3>
                  {/* <span className="rating">⭐ {club.rating}</span> */}
                </div>

                <p className="club-location">{club.state} - {club.district}</p>
                <p className="club-members">
                  {Number(club.player_count) > 0
                    ? club.player_count
                    : "No members"}
                </p>
                <Btn
                  text="View Club"
                  color="#1F3897"
                  onClick={() => viewClub(club.id)}
                />
              </div>
            ))
          )}
        </div></div>}

      {props.currentUser && <div>
        {/* State Clubs */}
        <h1 className="page-title">Clubs in {props.currentUser.state}</h1>
        <div className="clubs-grid">
          {stateClubs.length === 0 ? (

            <div className="empty-clubs">
              <div className="empty-clubs-icon">🏟️</div>

              <h3>No Clubs Found</h3>

              <p>
                No football clubs are registered in your state yet.
              </p>
            </div>

          ) : (
            stateClubs.map((club) => (
              <div className="club-box" key={club.id}>
                <div className="club-header">
                  <h3>{club.club_name}</h3>
                  {/* <span className="rating">⭐ {club.rating}</span> */}
                </div>

                <p className="club-location">{club.state} - {club.district}</p>
                <p className="club-members">
                  {Number(club.player_count) > 0
                    ? club.player_count
                    : "No members"}
                </p>
                <Btn
                  text="View Club"
                  color="#1F3897"
                  onClick={() => viewClub(club.id)}
                />
              </div>
            ))
          )}
        </div>
      </div>}


      {/* National Clubs */}
      <h1 className="page-title">National Clubs</h1>
      <div className="clubs-grid">
        {nationalClubs.length === 0 ? (

          <div className="empty-clubs">
            <div className="empty-clubs-icon">🇮🇳</div>

            <h3>No Clubs Available</h3>

            <p>
              Clubs will appear here once they register on FootConnect.
            </p>
          </div>

        ) : (
          nationalClubs.map((club) => (
            <div className="club-box" key={club.id}>
              <div className="club-header">
                <h3>{club.club_name}</h3>
                {/* <span className="rating">⭐ {club.rating}</span> */}
              </div>

              <p className="club-location">{club.state} - {club.district}</p>
              <p className="club-members">
                {Number(club.player_count) > 0
                  ? club.player_count
                  : "No members"}
              </p>
              <Btn
                text="View Club"
                color="#1F3897"
                onClick={() => viewClub(club.id)}
              />
            </div>
          ))
        )}
      </div>

    </div>
  );

}

export default Clubs;
