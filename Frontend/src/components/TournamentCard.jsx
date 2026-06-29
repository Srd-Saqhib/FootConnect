import "../styles/Home.css";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";

function TournamentCard({ tournament, openTournament }) {

    const today = new Date();

    const registrationDeadline = new Date(tournament.registration_deadline);
    const tournamentEnd = new Date(tournament.end_date);

    const registrationClosed = today > registrationDeadline;
    const tournamentEnded = today > tournamentEnd;

    const daysLeft = Math.ceil(
        (registrationDeadline - today) /
        (1000 * 60 * 60 * 24)
    );

    return (
        <div className="tournament-card">

            <div className="tour-header">
                <EmojiEventsIcon className="tour-trophy" />
                <span className="tour-badge">
                    Tournament
                </span>
            </div>

            <h3 className="tour-title">
                {tournament.title}
            </h3>

            <p className="tour-host">
                Hosted by {tournament.host_club}
            </p>

            <div className="tour-info">
                <p>
                    <LocationOnIcon />
                    {tournament.location}
                </p>

                <p>
                    <CalendarMonthIcon />
                    {new Date(tournament.start_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    })}
                    {" - "}
                    {new Date(tournament.end_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    })}
                </p>

                <p>
                    <GroupsIcon />
                    Max Teams: {tournament.max_teams}
                </p>
            </div>

            <div className="tour-status">
                {tournamentEnded
                    ? "🏁 Tournament Ended"
                    : registrationClosed
                        ? "🔒 Registration Closed"
                        : daysLeft > 1
                            ? `⏳ Registration closes in ${daysLeft} days`
                            : daysLeft === 1
                                ? "⏳ Registration closes tomorrow"
                                : "🔒 Registration Closed"}
            </div>

            <div className="tour-description">
                {tournament.description}
            </div>

            <button
                className="details-btn"
                onClick={() => openTournament(tournament)}
            >
                View Details
            </button>

        </div>
    );
}

export default TournamentCard;