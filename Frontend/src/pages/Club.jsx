import React, { useState, useEffect } from "react";
import MessageIcon from '@mui/icons-material/Message';
import CancelIcon from '@mui/icons-material/Cancel';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from "axios";
import Btn from "../components/Btn";
import "../styles/club.css";
import { useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

function Clubs(props) {
  const [localClubs, setLocalClubs] = useState([]);
  const [stateClubs, setStateClubs] = useState([]);
  const [nationalClubs, setNationalClubs] = useState([]);
  const [showWindow, setShowWindow] = useState(false);
  const [wbutton, setWbutton] = useState("clubChat");
  const [joinResult, setJoinResult] = useState(null);
  const [userNoti, setUserNoti] = useState([]);
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
  const [inputMessage, setInputMessage] = useState("");
  const [clubMessages, setClubMessages] = useState([]);

  const bottomRef = useRef(null);

  useEffect(() => {
    function handleConnect() {
      console.log("Connected:", socket.id);
    }

    socket.on("connect", handleConnect);
    socket.emit("hello", {
      name: props.currentUser?.name
    });

    return () => {
      socket.off("connect", handleConnect);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [clubMessages]);

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

  useEffect(() => {

    function handleNewMessage(message) {

      console.log("Received:", message);

      setClubMessages(prev => [...prev, message]);

    }

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };

  }, []);

  useEffect(() => {
    if (props.currentUser?.user_club_id) {

      socket.emit(
        "joinClub",
        props.currentUser.user_club_id
      );
    }
  }, [props.currentUser]);

  async function getClub() {
    const result = await axios.get("/api/clubs", {
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
    const result = await axios.get("/api/clubs");
    setNationalClubs(result.data.national);
  }

  function openWindow() {
    setShowWindow(prev => !prev);

    if (!showWindow && props.currentUser?.user_club_id) {
      getMessages();
    }
  }

  function changePanel(value) {
    setWbutton(value);

    if (value === "clubNotif" && props.currentUser) {
      getNotification();
    }
  }

  async function reqClub(club_id) {
    if (!props.currentUser) {
      alert("Please login to join a club");
      return;
    }

    try {
      const result = await axios.post(`/api/reqclub/${club_id}/${props.currentUser.id}`);
      setJoinResult(result.data);
      alert("Join request sent");
    } catch (err) {
      console.log(err.response);

      alert(
        err.response?.data?.message || "Request failed"
      );
    }
  }

  async function getNotification() {
    try {
      const result = await axios.get(`/api/notifications/${props.currentUser.id}`);
      setUserNoti(result.data.notifications);
    } catch (err) {
      console.error("Notification fetch failed", err);
    }
  }

  async function join_operation(action, requestId) {
    try {
      await axios.post(`/api/club/request/${requestId}`, {
        action,
        user_id: props.currentUser.id
      });
      getNotification();
    } catch (err) {
      console.error(err);
    }
  }

  async function friendlyOperation(action, matchId) {
    try {
      console.log("CLICKED", action, matchId);
      await axios.post(
        `/api/friendly/request/${matchId}`,
        { action }
      );

      getNotification();
    } catch (error) {
      console.log(error);
    }
  }

  async function followClub(clubId) {
    try {
      console.log("FOLLOWING CLUB:", clubId);
      const res = await axios.post("/api/club/follow", {
        clubId: clubId,
        userId: props.currentUser.id
      });
      console.log("FOLLOW RESPONSE:", res.data);
      getClub();
      getFollowedClub();
    }
    catch (error) {
      console.log(error);
    }
  }

  function viewClub(clubId) {
    console.log(clubId);
  }

  async function getFollowedClub() {
    try {
      const res = await axios.get(`/api/club/followed/${props.currentUser.user_club_id}`);
      setFollowedClubs(res.data.clubs);
    }
    catch (error) {
      console.log(error);
    }
  }

  async function createFriendly() {
    try {
      console.log("CREATE FRIENDLY CLICKED");
      await axios.post("/api/friendly/create", {
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
      await axios.post("/api/tournament/create", {
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

  async function getMessages() {
    try {
      const res = await axios.get("/api/getMessages", {
        params: {
          clubId: props.currentUser.user_club_id
        }
      });
      setClubMessages(res.data.messages);
    }
    catch (error) {
      console.log(error);
    }
  }

  async function sendMessage() {
    try {
      if (inputMessage.trim() === "") {
        return;
      }

      await axios.post("/api/sendMessage", {
        message: inputMessage,
        userId: props.currentUser.id,
        clubId: props.currentUser.user_club_id
      });
      setInputMessage("");
    }
    catch (error) {
      console.log(error);
    }
  }


  return (
    <div className="clubs-page">

      <MessageIcon className="msg-icon" onClick={openWindow} />

      {showWindow && (
        <div
          className="sidebar-overlay"
          onClick={() => setShowWindow(false)}
        >
          <div
            className="side-window"
            onClick={(e) => e.stopPropagation()}
          >
            <CancelIcon
              className="close-btn"
              onClick={() => setShowWindow(false)}
            />

            <h3 className="side-title">Club Panel</h3>

            <div className="side-actions">
              <div className="side-item" onClick={() => changePanel("clubChat")}>
                <MessageIcon className="side-icon" />
                <span>Club Chat</span>
              </div>

              <div className="side-item" onClick={() => changePanel("clubNotif")}>
                <NotificationsIcon className="side-icon" />
                <span>Notifications</span>
              </div>
            </div>

            <div className="msg-area">
              {wbutton === "clubChat" && (
                <div className="club-chat">

                  {props.currentUser?.role === "player" &&
                    !props.currentUser?.user_club_id ? (

                    <div className="chat-empty">
                      <span>Join a club to access club chat ⚽</span>
                    </div>

                  ) : (

                    <>

                      <div className="chat-messages">

                        {clubMessages.map((message) => (
                          <div
                            key={message.id}
                            className={
                              message.sender_id === props.currentUser.id
                                ? "chat-message self"
                                : "chat-message"
                            }
                          >
                            <div className="chat-avatar">
                              {message.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="chat-bubble">
                              <strong>{message.name}</strong>

                              <p>{message.message}</p>

                              <small>
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </small>
                            </div>
                          </div>
                        ))}
                        <div ref={bottomRef}></div>
                      </div>

                      <div className="chat-input-container">
                        <input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              sendMessage();
                            }
                          }}
                        />

                        <button
                          disabled={!inputMessage.trim()}
                          onClick={sendMessage}
                        >
                          Send
                        </button>
                      </div>

                    </>

                  )}

                </div>
              )}

              {wbutton == "clubNotif" && (
                <div className="club-notif">

                  {userNoti.length === 0 && (
                    <div className="notif-empty">
                      <span>No notifications 🔔</span>
                    </div>
                  )}

                  {userNoti.map((noti) => (
                    <div key={noti.id} className="notif-item">
                      <p>{noti.message}</p>

                      {/* Show actions only for join request */}
                      {noti.type === "club_join_request" && (
                        <div className="notif-actions">
                          <button onClick={() => { join_operation("accept", noti.request_id) }}>Accept</button>
                          <button onClick={() => { join_operation("decline", noti.request_id) }}>Decline</button>
                        </div>
                      )}
                      {noti.type === "friendly_request" && (
                        <div className="notif-actions">
                          <button
                            onClick={() => friendlyOperation("accept", noti.friendly_match_id)}
                          >
                            Accept
                          </button>

                          <button
                            onClick={() => friendlyOperation("decline", noti.friendly_match_id)}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              <p>Follow a club before creating a friendly.</p>
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
          {localClubs.map((club) => (
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
                text={
                  props.currentUser?.role === "player"
                    ? "Join Club"
                    : props.currentUser?.user_club_id === club.id
                      ? "View Club"
                      : club.is_following
                        ? "Unfollow"
                        : "Follow Club"
                }
                color="#1F3897"
                onClick={() => {
                  console.log("BUTTON CLICKED");
                  console.log(club);

                  if (props.currentUser?.role === "player") {
                    reqClub(club.id);
                  } else if (props.currentUser?.user_club_id === club.id) {
                    viewClub(club.id);
                  } else {
                    followClub(club.id);
                  }
                }}
              />
            </div>
          ))}
        </div></div>}

      {props.currentUser && <div>
        {/* State Clubs */}
        <h1 className="page-title">Clubs in {props.currentUser.state}</h1>
        <div className="clubs-grid">
          {stateClubs.map((club) => (
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
                text={
                  props.currentUser?.role === "player"
                    ? "Join Club"
                    : props.currentUser?.user_club_id === club.id
                      ? "View Club"
                      : club.is_following
                        ? "Unfollow"
                        : "Follow Club"
                }
                color="#1F3897"
                onClick={() => {
                  if (props.currentUser?.role === "player") {
                    reqClub(club.id);
                  } else if (props.currentUser?.user_club_id === club.id) {
                    viewClub(club.id);
                  } else {
                    followClub(club.id);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>}


      {/* National Clubs */}
      <h1 className="page-title">National Clubs</h1>
      <div className="clubs-grid">
        {nationalClubs.map((club) => (
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
              text={
                props.currentUser?.role === "player"
                  ? "Join Club"
                  : props.currentUser?.user_club_id === club.id
                    ? "View Club"
                    : club.is_following
                      ? "Unfollow"
                      : "Follow Club"
              }
              color="#1F3897"
              onClick={() => {
                if (props.currentUser?.role === "player") {
                  reqClub(club.id);
                } else if (props.currentUser?.user_club_id === club.id) {
                  viewClub(club.id);
                } else {
                  followClub(club.id);
                }
              }}
            />
          </div>
        ))}
      </div>

    </div>
  );

}

export default Clubs;
