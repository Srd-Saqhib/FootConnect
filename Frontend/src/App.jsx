import React, { useState, useEffect } from "react";
import axios from "axios";
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

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [toast, setToast] = useState({
    message: "",
    type: ""
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  async function refreshTournament(id) {
    try {
      const res = await axios.get(`/api/tournament/${id}`);
      setSelectedTournament(res.data.tournament);
    } catch (error) {
      console.log(error);
    }
  }

  function openClub(clubId) {
    setSelectedClub(clubId);
  }

  function openPlayer(playerId) {
    setSelectedPlayer(playerId);
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


      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <Sidebar
        currentUser={currentUser}
        openClub={openClub}
        openPlayer={openPlayer}
        setToast={setToast}
      />

      {currentPage === "home" &&
        (selectedTournament ? (
          <TournamentDetails
            tournament={selectedTournament}
            onBack={() => setSelectedTournament(null)}
            clubId={currentUser?.user_club_id}
            role={currentUser?.role}
            setToast={setToast}
            refreshTournament={refreshTournament}
          />
        ) : (
          <Home
            currentUser={currentUser}
            openTournament={setSelectedTournament}
          />
        ))
      }
      {currentPage === "clubs" &&
        (selectedClub ? (
          <ClubProfile
            clubId={selectedClub}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onBack={() => setSelectedClub(null)}
            openLogin={() => setShowLogin(true)}
            setToast={setToast}
          />
        ) : (
          <Clubs
            currentUser={currentUser}
            openClub={openClub}
          />
        ))
      }
      {currentPage === "news" && <News />}
      {currentPage === "community" &&
        (
          selectedClub ?
            <ClubProfile
              clubId={selectedClub}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              onBack={() => setSelectedClub(null)}
              openLogin={() => setShowLogin(true)}
              setToast={setToast}
            />
            :
            selectedPlayer ?
              <PlayerProfile
                playerId={selectedPlayer}
                currentUser={currentUser}
                onBack={() => setSelectedPlayer(null)}
                openClub={openClub}
              />
              :
              <Community
                currentUser={currentUser}
                openLogin={() => setShowLogin(true)}
                openClub={openClub}
                openPlayer={openPlayer}
              />
        )}

      {currentPage === "profile" &&
        <Profile user={currentUser}
          logout={() => { setIsLoggedIn(false); setCurrentUser(null); localStorage.removeItem("currentUser"); }}
          ssr={() => setShowRegister(true)}
          ssl={() => setShowLogin(true)}
          setToast={setToast} />
      }

      <Toast
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}

export default App;
