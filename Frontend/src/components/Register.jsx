import React, { useState } from "react";
import "../styles/login.css";
import axios from "axios";


function Register(props) {
  const [playerName, setPlayerName] = useState("");
  const [clubName, setClubName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("player");
 const [userState, setUserState] = useState("");
const [district, setDistrict] = useState("");



  const regions = {
    Karnataka: ["Udupi", "Mangalore", "Bangalore", "Mysore"],
    Kerala: ["Kochi", "Trivandrum", "Calicut"],
    TamilNadu: ["Chennai", "Coimbatore", "Madurai"]
  };


  async function handleSubmit(e) {
    e.preventDefault();

    const name = role === "player" ? playerName : clubName;

    if (!name) {
      setError(role === "player" ? "Player name is required" : "Club name is required");
      return;
    }

    if (!email.trim() || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      setError("Passwords do not match");
      return;
    }

    if (role === "player" && !position) {
      setError("Player position is required");
      return;
    }

    if (!userState || !district) {
      setError("State and District are required");
      return;
    }


    try {
      const res = await axios.post("/api/register", {
        role,
        name,
        email: email.trim(),
        position: role === "player" ? position : null,
        state: userState,
        district,
        password: password.trim(),
      });


      console.log("Server response:", res.data);
      setError("");
      if (res.data.success) {
        props.onSuccess && props.onSuccess(res.data.user);
      }
    } catch (err) {
      setError("Server error. Try again.");
    }
  }


  return (
    <div className="register-container">
      <h2>Create Account</h2>

      <div className="role-select">
        <button
          type="button"
          className={role === "player" ? "active" : ""}
          onClick={() => setRole("player")}
        >
          Single Player
        </button>

        <button
          type="button"
          className={role === "club" ? "active" : ""}
          onClick={() => setRole("club")}
        >
          Club
        </button>
      </div>

      <p style={{ fontSize: "13px", color: "#555", marginBottom: "10px" }}>
        Registering as: <strong>{role === "player" ? "Single Player" : "Club"}</strong>
      </p>


      <form onSubmit={handleSubmit}>
        {role === "player" && (
          <input
            type="text"
            placeholder="Player Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        )}

        {role === "club" && (
          <input
            type="text"
            placeholder="Club Name"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
          />
        )}

        {role === "player" && (
          <select
            className="form-input"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="">Select Position</option>
            <option value="GK">Goalkeeper</option>
            <option value="DEF">Defender</option>
            <option value="MID">Midfielder</option>
            <option value="FW">Forward</option>
          </select>
        )}

        {/* REGION SELECTION */}
        <div>
          <select
            className="form-input"
            value={userState}
            onChange={(e) => {
              setUserState(e.target.value);
              setDistrict("");
            }}
          >
            <option value="">Select State</option>
            {Object.keys(regions).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {userState && (
            <select
              className="form-input"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">Select District</option>
              {regions[userState].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>


        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">Register</button>

        <p className="text">
          Already have an account? <a href="#">Login</a>
        </p>
      </form>
    </div>
  );
}

export default Register;
