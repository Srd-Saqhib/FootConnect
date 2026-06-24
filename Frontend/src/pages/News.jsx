import React, { useState, useEffect } from "react";
import "../styles/news.css";
import api from "../api";
import Loading from "../components/Loading";

function News() {
  const [news, setNews] = useState([]);
  const [indianNews, setIndianNews] = useState([]);
  const [globalNews, setGlobalNews] = useState([]);
  const [loading, setLoading] = useState(true);

  function DisplayNews(loc) {
    if (loc === "indian") {
      setNews(indianNews);
    } else {
      setNews(globalNews);
    }
  }

  useEffect(() => {
    getNews();
  }, []);

  async function getNews() {
    try {
      setLoading(true);

      const result = await api.get("/api/news");

      setNews(result.data.indian);
      setIndianNews(result.data.indian);
      setGlobalNews(result.data.global);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function truncate(text, maxLength) {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }


  return (
    <div className="news-page">
      <h1 className="page-title">Football News</h1>
      <div className="category-btn">
        <button onClick={() => DisplayNews("indian")}>Indian</button>
        <button onClick={() => DisplayNews("global")}>Global</button>
      </div>

      <div className="news-list">

        {loading ? (

          <Loading
            text="Fetching latest football news..."
          />

        ) : (
          news.map((item) => (
            <div className="news-box" key={item.article_id}>
              <img src={item.image_url} alt={item.title} />

              <div className="news-content">
                <h3>{item.title}</h3>
                <p className="news-date">{item.pubDate?.split(" ")[0]}</p>
                <p className="news-summary">
                  {truncate(item.description, 200)}
                </p>

                <a href={item.link} target="_blank" rel="noreferrer" className="read-more">
                  Read more →
                </a>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default News;
