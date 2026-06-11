import ballImg from "../assets/ball.png";
import "../styles/Home.css";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';

function FriendlyCard({ match }) {
    const daysLeft = Math.ceil(
        (new Date(match.match_date) - new Date()) /
        (1000 * 60 * 60 * 24)
    );

    return (
        <div className="friendly-card">

            <div className="fixture">

                <div className="team">
                    <h3>{match.host_club}</h3>
                </div>

                <div className="vs-section">
                    <div className="ball-wrapper">
                        <img src={ballImg} alt="football" className="ball-img" />
                    </div>

                    <span className="vs-text">VS</span>
                </div>

                <div className="team">
                    <h3>{match.opponent_club}</h3>
                </div>

            </div>

            <div className="match-details">
                <p><LocationOnIcon /> {match.location}</p>
                <p>
                    <CalendarMonthIcon />
                    {match.match_date
                        ? new Date(match.match_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        })
                        : "Date not set"}
                </p>
                <p className="countdown">
                    {daysLeft > 0 ? (
                        <>
                            <HourglassTopIcon />
                            <span>{daysLeft} days left</span>
                        </>
                    ) : (
                        <>
                            <SportsSoccerIcon />
                            <span>Match Day</span>
                        </>
                    )}
                </p>

                <div className="match-description">
                    {match.description}
                </div>
            </div>

        </div>
    );
}

export default FriendlyCard;