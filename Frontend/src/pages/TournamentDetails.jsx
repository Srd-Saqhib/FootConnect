import "../styles/Home.css";
import { useEffect, useState } from "react";
import api from "../api";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UpdateResultModal from "../components/UpdateResultModal";

function TournamentDetails({ tournament, onBack, clubId, role, setToast, refreshTournament }) {
    const [registeredClubs, setRegisteredClubs] = useState([]);
    const [layout, setLayout] = useState("clubs");
    const [fixtureMatches, setFixtureMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);

    const registrationClosed = new Date() > new Date(tournament.registration_deadline);

    useEffect(() => {
        getRegistered();
        fetchFixtures();
    }, []);

    async function registerClub() {
        try {
            await api.post("/api/tournament/register", {
                clubId,
                tournamentId: tournament.id
            });

            setToast({
                message: "Tournament registration successful",
                type: "success"
            });

            setTimeout(() => {
                setToast({
                    message: "",
                    type: ""
                });
            }, 3000);

        } catch (error) {
            setToast({
                message:
                    error.response?.data?.message ||
                    "Registration failed",
                type: "error"
            });

            setTimeout(() => {
                setToast({
                    message: "",
                    type: ""
                });
            }, 3000);
        }
    }

    async function getRegistered() {
        try {
            const res = await api.get("/api/tournament/registeredClub", {
                params: {
                    tournamentId: tournament.id
                }
            });
            console.log(res.data);
            setRegisteredClubs(res.data.clubs);
        }
        catch (error) {
            console.log(error);
        }
    }

    async function generateFixtures() {
        try {
            const res = await api.post(
                "/api/tournament/generateFixtures",
                {
                    tournamentId: tournament.id
                }
            );
            setToast({
                message: res.data.message,
                type: "success"
            });
            setTimeout(() => {
                setToast({ message: "", type: "" });
            }, 3000);

            await fetchFixtures();
        } catch (error) {
            console.log(error);
            setToast({
                message: error.response?.data?.message,
                type: "error"
            });
            setTimeout(() => {
                setToast({ message: "", type: "" });
            }, 3000);
        }
    }

    async function fetchFixtures() {
        try {
            const res = await api.get("/api/tournament/fetchFixtures", {
                params: {
                    tournamentId: tournament.id
                }
            });
            setFixtureMatches(res.data.fixtures);
        }
        catch (error) {
            console.log(error);
        }
    }



    return (
        <div className="tournament-details">

            <button className="back-btn" onClick={onBack}>
                <ArrowBackIcon />
                Back
            </button>

            <div className="details-header">
                <EmojiEventsIcon className="details-trophy" />

                <div>
                    <h1>{tournament.title}</h1>
                    <p>Hosted by {tournament.host_club}</p>
                </div>
            </div>

            {tournament.champion_name && (
                <div className="champion-card">
                    <div className="champion-icon">
                        🏆
                    </div>
                    <div>
                        <p className="champion-label">
                            Tournament Champion
                        </p>
                        <h2 className="champion-name">
                            {tournament.champion_name}
                        </h2>
                    </div>
                </div>
            )}

            <div className="details-grid">

                <div className="detail-card">
                    <LocationOnIcon />
                    <div>
                        <h4>Location</h4>
                        <p>{tournament.location}</p>
                    </div>
                </div>

                <div className="detail-card">
                    <CalendarMonthIcon />
                    <div>
                        <h4>Tournament Dates</h4>
                        <p>
                            {new Date(tournament.start_date).toLocaleDateString()}
                            {" - "}
                            {new Date(tournament.end_date).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="detail-card">
                    <GroupsIcon />
                    <div>
                        <h4>Maximum Teams</h4>
                        <p>{tournament.max_teams}</p>
                    </div>
                </div>

            </div>

            <div className="description-box">
                <h3>Description</h3>

                <p>{tournament.description}</p>
            </div>

            <div className="layout-tabs">

                <button
                    className={layout === "clubs" ? "active-tab" : ""}
                    onClick={() => setLayout("clubs")}
                >
                    👥 Clubs
                </button>

                <button
                    className={layout === "fixtures" ? "active-tab" : ""}
                    onClick={() => setLayout("fixtures")}
                >
                    ⚽ Fixtures
                </button>

            </div>

            {layout == "clubs" &&
                <div className="registered-section">

                    <div className="registration-progress">

                        <h3>Participating Clubs</h3>

                        <span>
                            {registeredClubs.length}/{tournament.max_teams}
                        </span>

                    </div>

                    <div className="clubs-grid">

                        {registeredClubs.length === 0 ? (
                            <p>No clubs registered yet.</p>
                        ) : (
                            registeredClubs.map((club) => (
                                <div
                                    key={club.id}
                                    className="registered-club"
                                >
                                    <h4>{club.club_name}</h4>

                                    <span>
                                        📍 {club.district}, {club.state}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    {role === "club" &&
                        tournament.host_club_id !== clubId && (

                            <button
                                className="register-btn"
                                disabled={registrationClosed}
                                onClick={registerClub}
                            >
                                {registrationClosed
                                    ? "Registration Closed"
                                    : "Register Club"}
                            </button>

                        )}
                </div>
            }

            {layout === "fixtures" && (

                <div className="fixtures-list">

                    {fixtureMatches.length === 0 ? (

                        <p>Fixtures have not been generated yet.</p>

                    ) : (

                        fixtureMatches.map((match) => (
                            <div className="fixture-card" key={match.id}>

                                <h3 className="fixture-round">
                                    {match.round}
                                </h3>

                                <div className="fixture-row">

                                    <div className="fixture-side">
                                        <h4>{match.team1_name ?? "TBD"}</h4>
                                    </div>

                                    <div className="fixture-center">

                                        <span className="score">
                                            {match.status === "Completed"
                                                ? match.team1_score
                                                : ""}
                                        </span>

                                        <span className="vs">
                                            {match.status === "Completed"
                                                ? "-"
                                                : "VS"}
                                        </span>

                                        <span className="score">
                                            {match.status === "Completed"
                                                ? match.team2_score
                                                : ""}
                                        </span>

                                    </div>

                                    <div className="fixture-side">
                                        <h4>{match.team2_name ?? "TBD"}</h4>
                                    </div>

                                </div>

                                <div className="fixture-status">

                                    {match.status === "Completed"
                                        ? "✅ Finished"
                                        : match.team1_name == null
                                            ? "Waiting for previous round"
                                            : "⏳ Upcoming"}

                                </div>

                                {tournament.host_club_id === clubId && (

                                    match.status === "Completed" ? (

                                        <button
                                            className="generate-btn"
                                            disabled
                                        >
                                            Result Updated
                                        </button>

                                    ) : (

                                        <button
                                            className="generate-btn"
                                            onClick={() => setSelectedMatch(match)}
                                        >
                                            Update Result
                                        </button>

                                    )

                                )}

                            </div>
                        ))

                    )}

                    {tournament.host_club_id === clubId && (

                        registeredClubs.length === tournament.max_teams ? (
                            fixtureMatches.length === 0 ? (
                                <button
                                    className="generate-btn"
                                    onClick={generateFixtures}
                                >
                                    Generate Fixtures
                                </button>
                            ) : (
                                <button
                                    className="generate-btn"
                                    disabled
                                >
                                    Fixtures Generated
                                </button>
                            )
                        ) : (

                            <p className="waiting-text">
                                Waiting for {tournament.max_teams - registeredClubs.length} more club(s)...
                            </p>

                        )
                    )}

                </div>

            )}

            {
                selectedMatch && (
                    <div className="overlay">
                        <UpdateResultModal
                            match={selectedMatch}
                            tournament={tournament}
                            fetchFixtures={fetchFixtures}
                            refreshTournament={refreshTournament}
                            setToast={setToast}
                            onClose={() => setSelectedMatch(null)}
                        />
                    </div>
                )
            }

        </div>

    );

}

export default TournamentDetails;