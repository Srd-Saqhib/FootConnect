import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import api from "../api";
import "../styles/sidebar.css";
import MessageIcon from "@mui/icons-material/Message";
import CancelIcon from "@mui/icons-material/Cancel";
import NotificationsIcon from "@mui/icons-material/Notifications";
import GroupsIcon from "@mui/icons-material/Groups";

const socket = io(
    import.meta.env.VITE_SOCKET_URL
);

function Sidebar(props) {
    const [showWindow, setShowWindow] = useState(false);
    const [wbutton, setWbutton] = useState("clubChat");
    const [userNoti, setUserNoti] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [clubMessages, setClubMessages] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [playerMessages, setPlayerMessages] = useState([]);
    const [dmInput, setDmInput] = useState("");
    const bottomRef = useRef(null);
    const chatEndRef = useRef(null);

    const unread =
        userNoti.filter(
            n => !n.is_read
        ).length;

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

    requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    });

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [playerMessages]);

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
        function handlePlayerChat(message) {
            console.log("SOCKET MESSAGE", message.id);
            setPlayerMessages(prev => [...prev, message])
        }
        socket.on("playerChat", handlePlayerChat);

        return () => {
            socket.off("playerChat", handlePlayerChat);
        }
    }, []);

    useEffect(() => {
        function handleNotification(noti) {
            setUserNoti(prev => [noti, ...prev]);
            props.setToast({ message: noti.message, type: "success" });
            setTimeout(() => {
                props.setToast({ message: "", type: "" });
            }, 3000);
        }

        socket.on("notification", handleNotification);

        return () => {
            socket.off("notification", handleNotification);
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

    useEffect(() => {
        socket.emit("joinPlayer",
            props.currentUser?.player_id
        )

    }, [props.currentUser])

    useEffect(() => {
        if (
            props.currentUser?.user_club_id
        ) {
            getMessages();
        }
    }, [props.currentUser]);


    useEffect(() => {
        function handle(e) {
            if (e.key === "Escape") {
                setShowWindow(false);
            }
        }

        window.addEventListener(
            "keydown",
            handle
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handle
            );
        };
    }, []);



    function openWindow() {

        if (!props.currentUser) {

            props.setToast({
                message: "Please login first.",
                type: "error"
            });

            return;
        }

        if (!showWindow) {
            getNotification();
        }
        setShowWindow(prev => !prev);
    }

    function changePanel(value) {
        setWbutton(value);

        if (
            value === "connections"
        ) {
            getConnections();
        }

        if (
            value === "notifications"
        ) {
            getNotification();
        }

    }

    async function getNotification() {
        try {
            const result = await api.get(`/api/notifications/${props.currentUser.id}`);
            setUserNoti(result.data.notifications);
        } catch (err) {
            console.error("Notification fetch failed", err);
        }
    }

    async function join_operation(action, requestId) {
        try {
            await api.post(`/api/club/request/${requestId}`, {
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
            await api.post(
                `/api/friendly/request/${matchId}`,
                { action }
            );

            getNotification();
        } catch (error) {
            console.log(error);
        }
    }

    async function respondConnection(connectionId, notificationId, action) {
        try {
            await api.post("/api/player/connect/respond", {
                connectionId,
                notificationId,
                action
            }
            );

            getNotification();

            props.setToast({
                message:
                    action === "accept"
                        ?
                        "Connection accepted."
                        :
                        "Connection declined.",
                type: "success"
            });
        }
        catch (err) {
            console.log(err);

            props.setToast({
                message: "Something went wrong.",
                type: "error"
            });
        }
    }

    async function getMessages() {
        try {
            const res = await api.get("/api/getMessages", {
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

    async function getConnections() {
        try {
            const res = await api.get(`/api/player/connections/${props.currentUser.id}`);
            setConnections(res.data.connections);
        }
        catch (err) {
            console.log(err);
        }
    }

    async function sendMessage() {
        try {
            if (inputMessage.trim() === "") {
                return;
            }

            await api.post("/api/sendMessage", {
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

    async function openConnectionChat(player) {
        setSelectedConnection(player);
        const res =
            await api.get(
                `/api/player/messages/${player.id}`,
                {
                    params: {
                        userId: props.currentUser.id
                    }
                }
            );

        setPlayerMessages(res.data.messages);
    }

    async function sendDM() {

        if (!dmInput.trim()) return;

        const res = await api.post(
            "/api/player/message/send",
            {
                senderUserId: props.currentUser.id,
                receiverPlayerId: selectedConnection.id,
                message: dmInput
            }
        );


        setPlayerMessages(
            prev => [...prev, res.data.message]
        );
        setDmInput("");
    }

    async function clubInvite(inviteId, action) {
        try {

            await api.post(`/api/player/invite/${inviteId}`, {
                action
            });

            if (action === "accept") {

                const res = await api.get("/api/me", {
                    params: {
                        userId: props.currentUser.id
                    }
                });

                props.setCurrentUser(res.data.user);

                localStorage.setItem(
                    "currentUser",
                    JSON.stringify(res.data.user)
                );
            }

            await getNotification();


            props.setToast({
                message:
                    action === "accept"
                        ? "Club joined successfully."
                        : "Invitation declined.",
                type: "success"
            });
            setTimeout(() => {
                props.setToast({ message: "", type: "" });
            }, 3000)

        } catch (error) {

            props.setToast({
                message:
                    error.response?.data?.message ||
                    "Something went wrong.",
                type: "error"
            });
            setTimeout(() => {
                props.setToast({ message: "", type: "" });
            }, 3000)

        }
    }


    return (
        <div>
            {props.currentUser && (
                <div className="sidebar-icon-wrapper">
                    <MessageIcon
                        className="msg-icon"
                        onClick={openWindow}
                    />
                    {unread > 0 && (
                        <span className="badge">
                            {unread}
                        </span>
                    )}
                </div>
            )}

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

                        <h3 className="side-title">Football Hub</h3>

                        <div className="side-actions">
                            <div
                                className={`side-item ${wbutton === "clubChat"
                                    ? "active-side-item"
                                    : ""
                                    }`}
                                onClick={() => changePanel("clubChat")}
                            >
                                <MessageIcon className="side-icon" />
                                <span>Club Chat</span>
                            </div>

                            <div
                                className={`side-item ${wbutton === "connections"
                                    ? "active-side-item"
                                    : ""
                                    }`}
                                onClick={() => changePanel("connections")}
                            >
                                <GroupsIcon className="side-icon" />
                                <span>Connections</span>
                            </div>

                            <div
                                className={`side-item ${wbutton === "notifications"
                                    ? "active-side-item"
                                    : ""
                                    }`}
                                onClick={() => changePanel("notifications")}
                            >
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

                                            <div className="chat-empty-card">

                                                <div className="chat-empty-icon">
                                                    💬
                                                </div>

                                                <h3>Club Chat Locked</h3>

                                                <p>
                                                    Join a football club to chat with your teammates,
                                                    discuss tactics, and stay updated with club announcements.
                                                </p>

                                            </div>

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

                            {wbutton == "notifications" && (
                                <div className="club-notif">

                                    {userNoti.length === 0 && (
                                        <div className="notif-empty">
                                            <span>No notifications 🔔</span>
                                        </div>
                                    )}

                                    {userNoti.map((noti) => (
                                        <div key={noti.id} className="notif-item">
                                            <p>{noti.message}</p>

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

                                            {
                                                noti.type === "player_connection" && (

                                                    noti.is_read ? (

                                                        <div className="notif-status">

                                                            ✓ Request handled

                                                        </div>

                                                    ) : (

                                                        <div className="notif-actions">

                                                            <button
                                                                onClick={() =>
                                                                    respondConnection(
                                                                        noti.request_id,
                                                                        noti.id,
                                                                        "accept"
                                                                    )
                                                                }
                                                            >
                                                                Accept
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    respondConnection(
                                                                        noti.request_id,
                                                                        noti.id,
                                                                        "decline"
                                                                    )
                                                                }
                                                            >
                                                                Decline
                                                            </button>

                                                        </div>

                                                    )

                                                )
                                            }

                                            {noti.type === "club_invite" && (
                                                <div className="notif-actions">

                                                    <button
                                                        onClick={() =>
                                                            clubInvite(
                                                                noti.player_invite_id,
                                                                "accept"
                                                            )
                                                        }
                                                    >
                                                        Accept
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            clubInvite(
                                                                noti.player_invite_id,
                                                                "decline"
                                                            )
                                                        }
                                                    >
                                                        Decline
                                                    </button>

                                                </div>
                                            )}
                                        </div>
                                    ))}

                                </div>
                            )}

                            {wbutton === "connections" && (

                                <div className="connections-panel">

                                    {
                                        connections.length === 0 ?

                                            <div className="empty-connections">

                                                <h3>No Connections Yet</h3>

                                                <p>
                                                    Connect with players from the community to start chatting.
                                                </p>

                                            </div>

                                            :

                                            selectedConnection ? (
                                                <div className="player-chat">

                                                    <div
                                                        className="chat-header"
                                                        onClick={() => props.openPlayer(selectedConnection.id)}
                                                    >

                                                        <button
                                                            className="back-chat-btn"
                                                            onClick={(e) => {

                                                                e.stopPropagation();

                                                                setSelectedConnection(null);

                                                            }}
                                                        >
                                                            ←
                                                        </button>

                                                        <div className="chat-player-info">

                                                            <h3>
                                                                {selectedConnection.player_name}
                                                            </h3>

                                                            <p>
                                                                {selectedConnection.position} • {selectedConnection.club_name}
                                                            </p>

                                                        </div>

                                                    </div>

                                                    <div className="chat-messages">
                                                        {
                                                            playerMessages.map((msg) => (

                                                                <div
                                                                    key={msg.id}
                                                                    className={
                                                                        msg.sender_player_id === props.currentUser.player_id
                                                                            ? "dm-message self"
                                                                            : "dm-message"
                                                                    }
                                                                >

                                                                    <div className="dm-avatar">
                                                                        {
                                                                            msg.sender_player_id === props.currentUser.player_id
                                                                                ? props.currentUser.name[0]
                                                                                : selectedConnection.player_name[0]
                                                                        }
                                                                    </div>

                                                                    <div className="dm-bubble">

                                                                        <strong>
                                                                            {
                                                                                msg.sender_player_id === props.currentUser.player_id
                                                                                    ? props.currentUser.name
                                                                                    : selectedConnection.player_name
                                                                            }
                                                                        </strong>

                                                                        <p>{msg.message}</p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                        <div ref={chatEndRef}></div>
                                                    </div>

                                                    <div className="chat-input">
                                                        <input
                                                            value={dmInput}
                                                            onChange={(e) =>
                                                                setDmInput(e.target.value)
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    sendDM();
                                                                }
                                                            }}
                                                            placeholder="Type a message..."
                                                        />

                                                        <button
                                                            onClick={sendDM}
                                                        >
                                                            Send
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                                :
                                                (
                                                    <div className="connections-list">
                                                        {
                                                            connections.map(player => (
                                                                <div
                                                                    key={player.id}
                                                                    className="connection-card"
                                                                    onClick={() => openConnectionChat(player)}
                                                                >
                                                                    <div className="connection-avatar">
                                                                        {player.player_name.charAt(0).toUpperCase()}
                                                                    </div>

                                                                    <div className="connection-info">
                                                                        <h4>

                                                                            {player.player_name}

                                                                        </h4>

                                                                        <p>

                                                                            {player.position} • {player.club_name}

                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>)
                                    }
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )
            }
        </div >

    )
}

export default Sidebar;