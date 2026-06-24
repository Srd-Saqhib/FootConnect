import { useEffect, useState } from "react";
import api from "../api";
import Loading from "../components/Loading";
import "../styles/playerprofile.css";

import PersonIcon from "@mui/icons-material/Person";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import GroupsIcon from "@mui/icons-material/Groups";

function PlayerProfile({ playerId, currentUser, onBack, openClub }) {

    const [playerData, setPlayerData] = useState(null);
    const [activeTab, setActiveTab] = useState("posts");

    useEffect(() => {
        fetchPlayer();
    }, []);

    async function fetchPlayer() {

        try {

            const res = await api.get(`/api/player/${playerId}`, {
                params: {
                    viewerUserId: currentUser.id
                }
            });

            setPlayerData(res.data);

        }

        catch (err) {

            console.log(err);

        }

    }

    if (!playerData) {

        return (
            <Loading
                text="Loading player..."
            />
        );

    }

    async function connectPlayer() {
        try {
            await api.post("/api/player/connect", {
                senderUserId: currentUser.id,
                receiverPlayerId: playerData.player.id
            });
            await fetchPlayer();
        }
        catch (err) {
            console.log(err);
        }
    }
    return (

        <div className="player-profile">

            <button
                className="back-btn"
                onClick={onBack}
            >
                ← Back
            </button>

            <div className="player-header">

                <div className="player-avatar">

                    <PersonIcon sx={{ fontSize: 55 }} />

                </div>

                <div className="player-info">

                    <h1>{playerData.player.player_name}</h1>

                    <div className="player-meta">

                        <span>

                            <SportsSoccerIcon fontSize="small" />

                            {playerData.player.position}

                        </span>

                        <span
                            className="club-link"
                            onClick={() => openClub(playerData.club.id)}
                        >

                            <GroupsIcon fontSize="small" />

                            {playerData.club.club_name}

                        </span>

                        <span>

                            📅

                            Joined {

                                new Date(
                                    playerData.player.created_at
                                ).getFullYear()

                            }

                        </span>

                    </div>

                </div>

            </div>

            {
                currentUser &&
                currentUser.id !== playerData.player.user_id && (

                    <div className="profile-actions">

                        {
                            currentUser.role === "player" ? (

                                <>
                                    {
                                        playerData.connection_status === "none" && (
                                            <button
                                                className="profile-btn"
                                                onClick={connectPlayer}
                                            >
                                                Connect
                                            </button>
                                        )
                                    }

                                    {
                                        playerData.connection_status === "pending" && (
                                            <button
                                                className="profile-btn pending"
                                                disabled
                                            >
                                                Pending
                                            </button>
                                        )
                                    }

                                    {
                                        playerData.connection_status === "accepted" && (
                                            <button
                                                className="profile-btn connected"
                                                disabled
                                            >
                                                ✓ Connected
                                            </button>
                                        )
                                    }
                                </>

                            ) : (

                                <button className="profile-btn">
                                    Invite Player
                                </button>

                            )
                        }

                    </div>

                )
            }

            <div className="player-stats">

                <div className="stat-card">

                    <h2>{playerData.stats.posts}</h2>

                    <p>Posts</p>

                </div>

                <div className="stat-card">

                    <h2>{playerData.stats.connections}</h2>

                    <p>Connections</p>

                </div>

                <div className="stat-card">

                    <h2>

                        {playerData.player.position}

                    </h2>

                    <p>

                        Position

                    </p>

                </div>

            </div>

            <div className="club-tabs">

                <button
                    className={activeTab === "posts" ? "active-tab" : ""}
                    onClick={() => setActiveTab("posts")}
                >
                    Posts
                </button>

                <button
                    className={activeTab === "about" ? "active-tab" : ""}
                    onClick={() => setActiveTab("about")}
                >
                    About
                </button>

            </div>

            {
                activeTab === "posts"
                    ?
                    <div className="club-section">
                        {
                            playerData.posts.length === 0
                                ?
                                <p>No posts yet.</p>

                                :

                                playerData.posts.map(post => (
                                    <div
                                        key={post.id}
                                        className="player-post"
                                    >
                                        <p>

                                            {post.content}

                                        </p>

                                        <div className="post-footer">

                                            <small>

                                                {new Date(
                                                    post.created_at
                                                ).toLocaleDateString()}

                                            </small>

                                        </div>
                                    </div>
                                ))
                        }
                    </div>

                    :

                    <div className="club-section">
                        <h2>About</h2>

                        <p>
                            {playerData.player.bio || "No bio added."}
                        </p>
                        <br />

                        <p>
                            <strong>Position:</strong>

                            {" "}

                            {playerData.player.position}
                        </p>

                        <p>
                            <strong>Club:</strong>

                            {" "}

                            {playerData.club.club_name}
                        </p>

                    </div>

            }
        </div>
    );
}

export default PlayerProfile;