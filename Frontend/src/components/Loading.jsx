import "../styles/loading.css";

function Loading({ text = "Loading..." }) {

    return (

        <div className="loading">

            <div className="loader"></div>

            <p>{text}</p>

        </div>

    );

}

export default Loading;