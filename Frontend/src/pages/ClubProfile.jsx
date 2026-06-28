import { useEffect, useState } from "react";
import api from "../api";
import "../styles/clubprofile.css"
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import Loading from "../components/Loading";

function ClubProfile({ clubId, currentUser, setCurrentUser, onBack, openLogin, setToast }) {
    const [clubData, setClubData] = useState(null);
    const [activeTab, setActiveTab] = useState("players");

    useEffect(() => {
        fetchClub();
    }, [clubId]);

    async function fetchClub() {
        const res = await api.get(`/api/club/${clubId}`, {
            params: {
                userId: currentUser?.id
            }
        });
        setClubData(res.data);
    }

    if (!clubData) {
        return (
            <Loading
                text="Loading club..."
            />
        );

    }

    async function reqClub() {
        if (!currentUser) {
            setToast({
                message: "Please login first",
                type: "error"
            })
            setTimeout(() => {
                setToast({ message: "", type: "" });
            }, 3000)
            return;
        }

        try {
            await api.post(
                `/api/reqclub/${clubData.club.id}/${currentUser.id}`
            );
            await fetchClub();
            setToast({
                message: "Join request sent",
                type: "success"
            });
            setTimeout(() => {
                setToast({ message: "", type: "" });
            }, 3000)
        }
        catch (err) {
            setToast({
                message:
                    err.response?.data?.message ||
                    "Request failed",
                type: "error"
            });
            setTimeout(() => {
                setToast({ message: "", type: "" });
            }, 3000)
        }
    }

    async function followClub() {
        try {
            if (clubData.isFollowing) {
                await api.post("/api/club/unfollow", {
                    clubId: clubData.club.id,
                    userId: currentUser.id
                });
            }
            else {
                await api.post("/api/club/follow", {
                    clubId: clubData.club.id,
                    userId: currentUser.id
                });
            }
            setToast({
                message:
                    clubData.isFollowing
                        ?
                        "Club unfollowed"
                        :
                        "Club followed",
                type: "success"
            });
            setTimeout(() => {
                setToast({ message: "", type: "" });
            }, 3000);
            await fetchClub();
        }
        catch (error) {
            console.log(error);
        }
    }

    async function leaveClub() {
        try {
            await api.post("/api/club/leave", {
                userId: currentUser.id
            });

            setToast({
                message: "Left club successfully",
                type: "success"
            });
            setTimeout(() => {
                setToast({
                    message: "",
                    type: ""
                });
            }, 3000);

            const res = await api.get("/api/me", {
                params: {
                    userId: currentUser.id
                }
            });

            setCurrentUser(res.data.user);

            localStorage.setItem(
                "currentUser",
                JSON.stringify(res.data.user)
            );

            await fetchClub();

            onBack();

        }
        catch (err) {
            setToast({
                message:
                    err.response?.data?.message ||
                    "Unable to leave club",
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

    return (
        <div className="club-profile">

            <button
                className="back-btn"
                onClick={onBack}
            >
                ← Back
            </button>

            {/* Header */}

            <div className="profile-header">

                <div className="club-avatar">
                    ⚽
                </div>

                <div className="club-info">

                    <h1>{clubData.club.club_name}</h1>

                    <div className="club-meta">

                        <span>
                            <LocationOnIcon fontSize="small" />
                            {clubData.club.district}, {clubData.club.state}
                        </span>

                        <span>
                            <CalendarMonthIcon fontSize="small" />
                            Founded {clubData.club.founded_year}
                        </span>

                        <span>
                            <GroupsIcon fontSize="small" />
                            {clubData.stats.players} Players
                        </span>

                    </div>

                </div>

            </div>

            <div className="profile-actions">

                {/* Not Logged In */}
                {!currentUser && (
                    <button
                        className="profile-btn"
                        onClick={openLogin}
                    >
                        Login to Join
                    </button>
                )}

                {/* Player */}
                {currentUser?.role === "player" && (

                    !currentUser.user_club_id ?

                        <button
                            className="profile-btn"
                            onClick={reqClub}
                        >
                            Join Club
                        </button>

                        : currentUser.user_club_id === clubData.club.id ?

                            <div className="member-actions">

                                <button
                                    className="profile-btn disabled"
                                    disabled
                                >
                                    ✓ Member
                                </button>

                                <button
                                    className="leave-btn"
                                    onClick={leaveClub}
                                >
                                    Leave Club
                                </button>

                            </div>

                            :

                            <button
                                className="profile-btn disabled"
                                disabled
                            >
                                Already in another club
                            </button>

                )}

                {/* Club */}
                {currentUser?.role === "club" &&
                    currentUser.user_club_id !== clubData.club.id && (
                        <button
                            className="profile-btn"
                            onClick={followClub}
                        >
                            {clubData.isFollowing ?
                                "Unfollow"
                                :
                                "Follow Club"
                            }
                        </button>
                    )}
            </div>

            {/* Statistics */}

            <div className="club-stats">

                <div className="stat-card">
                    <h2>{clubData.stats.followers}</h2>
                    <p>Followers</p>
                </div>

                <div className="stat-card">
                    <h2>{clubData.stats.players}</h2>
                    <p>Players</p>
                </div>

                <div className="stat-card">
                    <h2>{clubData.stats.tournaments}</h2>
                    <p>Tournaments</p>
                </div>

                <div className="stat-card">
                    <h2>{clubData.stats.friendlies}</h2>
                    <p>Friendlies</p>
                </div>

            </div>

            {/* About */}

            <div className="club-section">

                <h2>About</h2>

                <p>
                    {clubData.club.description || "No description available."}
                </p>

            </div>

            <div className="club-tabs">

                <button
                    className={activeTab === "players" ? "active-tab" : ""}
                    onClick={() => setActiveTab("players")}
                >
                    Players
                </button>

                <button
                    className={activeTab === "tournaments" ? "active-tab" : ""}
                    onClick={() => setActiveTab("tournaments")}
                >
                    Tournaments
                </button>

                <button
                    className={activeTab === "friendlies" ? "active-tab" : ""}
                    onClick={() => setActiveTab("friendlies")}
                >
                    Friendlies
                </button>

            </div>

            {/* Players */}
            {activeTab === "players" && (
                <div className="club-section">

                    <h2>Players</h2>

                    {
                        clubData.players.length === 0
                            ? (
                                <p>No players registered.</p>
                            )
                            : (
                                clubData.players.map((player) => (

                                    <div
                                        key={player.id}
                                        className="player-card"
                                    >
                                        <div className="player-details">

                                            <h3>{player.player_name}</h3>
                                            <span className="player-position">
                                                {player.position}
                                            </span>
                                            <p>{player.bio || "No bio available."}</p>

                                        </div>

                                    </div>

                                ))
                            )
                    }

                </div>
            )}

            {/* Hosted Tournaments */}
            {activeTab === "tournaments" && (
                <div className="club-section">

                    <h2>Hosted Tournaments</h2>

                    {
                        clubData.tournaments.length === 0
                            ? (
                                <p>No tournaments hosted.</p>
                            )
                            : (
                                clubData.tournaments.map((tournament) => (

                                    <div
                                        key={tournament.id}
                                        className="tournament-card"
                                    >

                                        <h3>{tournament.title}</h3>

                                        <p>{tournament.description}</p>

                                        <p>{tournament.location}</p>

                                        <p>Status: {tournament.status}</p>

                                    </div>

                                ))
                            )
                    }

                </div>
            )}

            {/* Friendlies */}
            {activeTab === "friendlies" && (
                <div className="club-section">

                    <h2>Friendly Matches</h2>

                    {
                        clubData.friendlies.length === 0
                            ? (
                                <p>No friendly matches.</p>
                            )
                            : (
                                clubData.friendlies.map((match) => (

                                    <div
                                        key={match.id}
                                        className="friendly-card"
                                    >

                                        <h3>{match.title}</h3>

                                        <p>{match.location}</p>

                                        <p>{match.status}</p>

                                        <p>
                                            {new Date(match.match_date).toLocaleDateString()}
                                        </p>

                                    </div>

                                ))
                            )
                    }

                </div>
            )}

        </div>
    );
}

export default ClubProfile;