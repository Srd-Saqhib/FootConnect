import { useState } from "react";
import "../styles/Home.css";
import api from "../api";

function UpdateResultModal({ match, onClose, fetchFixtures, refreshTournament, tournament, setToast }) {

    const [team1Score, setTeam1Score] = useState("");
    const [team2Score, setTeam2Score] = useState("");

    async function submitResult() {
        if (team1Score === "" || team2Score === "") {
            setToast({
                message: "Please enter both team scores.",
                type: "error"
            });
            setTimeout(() => {
                setToast({ message: "", type: "" });
            }, 3000);
            return;
        }

        try {
            await api.post("/api/tournament/matchResult", {
                match,
                tournamentId: tournament.id,
                team1Score,
                team2Score
            });

            await Promise.all([
                fetchFixtures(),
                refreshTournament(tournament.id)
            ]);
            setToast({
                message: "Result updated successfully.",
                type: "success"
            });
            setTimeout(() => {
                setToast({ message: "", type: "" });
            }, 3000);

            onClose();

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>

            <div
                className="result-modal"
                onClick={(e) => e.stopPropagation()}
            >

                <h2>Update Match Result</h2>

                <p className="result-subtitle">
                    Enter the final score for this fixture
                </p>

                <div className="result-scoreboard">

                    <div className="result-team">

                        <h3>{match.team1_name}</h3>

                        <input
                            type="number"
                            min="0"
                            value={team1Score}
                            onChange={(e) => setTeam1Score(e.target.value)}
                        />

                    </div>

                    <div className="result-vs">
                        VS
                    </div>

                    <div className="result-team">

                        <h3>{match.team2_name}</h3>

                        <input
                            type="number"
                            min="0"
                            value={team2Score}
                            onChange={(e) => setTeam2Score(e.target.value)}
                        />

                    </div>

                </div>

                <p className="winner-note">
                    Winner will be selected automatically based on the score.
                </p>

                <div className="modal-actions">

                    <button
                        className="cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="save-btn"
                        onClick={submitResult}
                    >
                        Save Result
                    </button>

                </div>

            </div>

        </div>
    );
}

export default UpdateResultModal;