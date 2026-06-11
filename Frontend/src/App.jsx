import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./pages/Home";
import Clubs from "./pages/Club";
import News from "./pages/News";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import "./App.css";


function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

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

      {currentPage === "home" && <Home />}
      {currentPage === "clubs" && <Clubs currentUser={currentUser} />}
      {currentPage === "news" && <News />}
      {currentPage === "community" && <Community currentUser={currentUser} openLogin={() => setShowLogin(true)} />}
      {currentPage === "profile" && <Profile user={currentUser} logout={() => { setIsLoggedIn(false); setCurrentUser(null); localStorage.removeItem("currentUser"); }} ssr={() => setShowRegister(true)} ssl={() => setShowLogin(true)} />}

    </div>
  );
}

export default App;
