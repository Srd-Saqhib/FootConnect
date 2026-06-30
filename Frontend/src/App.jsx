import React, { useState, useEffect } from "react";
import api from "./api";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./pages/Home";
import Clubs from "./pages/Club";
import News from "./pages/News";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import "./App.css";
import TournamentDetails from "./pages/TournamentDetails";
import ClubProfile from "./pages/ClubProfile";
import PlayerProfile from "./pages/PlayerProfile";
import Toast from "./components/toast";
import { Routes, Route, useNavigate } from "react-router-dom";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState({
    message: "",
    type: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);

        // try to refresh user from backend for full profile
        api.get("/api/me", { params: { userId: parsed.id } })
          .then((res) => {
            setCurrentUser(res.data.user);
            setIsLoggedIn(true);
          })
          .catch(() => {
            // fallback to local storage
            setCurrentUser(parsed);
            setIsLoggedIn(true);
          });

      } catch (e) {
        // invalid JSON - clear
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  function openTournament(tournament) {
    navigate(`/tournament/${tournament.id}`);
  }

  function openClub(clubId) {
    navigate(`/clubprofile/${clubId}`);
  }

  function openPlayer(playerId) {
    navigate(`/playerProfile/${playerId}`);
  }
  return (
    <div>
      <Header
        isLoggedIn={isLoggedIn}
        onLogin={() => setShowLogin(true)}
        setIsLoggedIn={setIsLoggedIn}
        onRegister={() => setShowRegister(true)}
        Rdisable={showLogin}
        Sdisable={showRegister}
      />

      <Navbar />

      <Sidebar
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        openClub={openClub}
        openPlayer={openPlayer}
        setToast={setToast}
      />

      {showLogin && (
        <div onClick={() => setShowLogin(false)} className="modal-overlay">
          <div onClick={(e) => e.stopPropagation()} className="inner">
            <Login
              onSuccess={(user) => {
                setCurrentUser(user);
                localStorage.setItem("currentUser", JSON.stringify(user));
                setIsLoggedIn(true);
                setShowLogin(false);
              }}
            />
          </div>
        </div>
      )}

      {showRegister && (
        <div onClick={() => setShowRegister(false)} className="modal-overlay">
          <div onClick={(e) => e.stopPropagation()} className="inner">
            <Register
              onSuccess={(user) => {
                setCurrentUser(user);
                localStorage.setItem("currentUser", JSON.stringify(user));
                setIsLoggedIn(true);
                setShowRegister(false);
              }}
            />
          </div>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <Home
              currentUser={currentUser}
              openTournament={openTournament}
            />
          }
        />

        <Route
          path="/tournament/:id"
          element={
            <TournamentDetails
              currentUser={currentUser}
              role={currentUser?.role}
              setToast={setToast}
            />
          }
        />

        <Route path="/clubprofile/:id" element={
          <ClubProfile
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            openLogin={() => setShowLogin(true)}
            setToast={setToast}
          />} />

        <Route path="/clubs" element={
          <Clubs
            currentUser={currentUser}
            openClub={openClub}
            setToast={setToast}
          />} />


        <Route path="/news" element={<News />} />

        <Route path="/playerProfile/:id" element={
          <PlayerProfile
            currentUser={currentUser}
            openClub={openClub}
            setToast={setToast}
          />
        } />

        <Route path="/community" element={
          <Community
            currentUser={currentUser}
            openLogin={() => setShowLogin(true)}
            openClub={openClub}
            openPlayer={openPlayer}
          />
        } />


        <Route path="/profile" element={
          <Profile user={currentUser}
            logout={() => { setIsLoggedIn(false); setCurrentUser(null); localStorage.removeItem("currentUser"); }}
            ssr={() => setShowRegister(true)}
            ssl={() => setShowLogin(true)}
            setToast={setToast}
            openClub={openClub} />
        } />

      </Routes>

      <Toast
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}

export default App;
