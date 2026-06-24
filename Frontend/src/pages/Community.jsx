import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import api from "../api";
import "../styles/Community.css";
import Toast from "../components/toast";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

function Community(props) {
  const [openPost, setOpenPost] = useState(null);
  const [inputContent, setInputContent] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postMenu, setPostMenu] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [toast, setToast] = useState({
    message: "",
    type: ""
  });
  const [comment, setComment] = useState("");
  const [commentSection, setCommentSection] = useState([]);
  const [commentMenu, setCommentMenu] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [feed, setFeed] = useState("general");

  function displayArea() {
    if (showInput) {
      setShowInput(false);
    } else {
      setShowInput(true);
    }
  }

  useEffect(() => {
    refreshFeed();
  }, [feed]);

  async function getPosts() {
    try {
      const res = await api.get("/api/posts", {
        params: {
          userId: props.currentUser?.id
        }
      });

      if (res.data.success) {
        console.log(res.data.posts);
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error("Failed to load posts", err);
    }
  }

  async function getFollowingPosts() {
    try {
      const res = await api.get(
        `/api/posts/following/${props.currentUser.id}`
      );
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    }
    catch (err) {
      console.log(err);
    }
  }

  async function getMyPosts() {
    try {
      const res = await api.get(
        `/api/posts/me/${props.currentUser.id}`
      );

      setPosts(res.data.posts);
    }
    catch (err) {
      console.log(err);
    }
  }

  function refreshFeed() {
    if (feed === "general") {
      getPosts();
    }
    else if (feed === "following") {
      getFollowingPosts();
    }
    else {
      getMyPosts();
    }
  }

  async function sendPost() {
    if (!props.currentUser) {
      props.openLogin();
      setShowInput(false);
      return;
    }

    if (!inputContent.trim()) {
      return;
    }

    if (editingPostId) {
      await api.post("/api/post/edit", {
        postId: editingPostId,
        value: inputContent.trim(),
        userId: props.currentUser.id
      });

      setToast({
        message: "Post updated successfully",
        type: "success"
      });

      setTimeout(() => {
        setToast({ message: "", type: "" });
      }, 3000)

      setEditingPostId(null);
      refreshFeed();
    } else {
      await api.post("/api/posts", {
        userId: props.currentUser.id,
        content: inputContent.trim()
      });

      setToast({
        message: "Post created successfully",
        type: "success"
      });

      setTimeout(() => {
        setToast({ message: "", type: "" });
      }, 3000);
    }

    setInputContent("");
    refreshFeed();
    setShowInput(false);
  }

  function editPost(post) {
    setEditingPostId(post.id);
    setInputContent(post.content);
    setShowInput(true);
    setPostMenu(null);
  }

  async function deletePost(postID) {
    try {
      await api.post("/api/post/delete", {
        postId: postID,
        userId: props.currentUser.id
      });

      setToast({
        message: "Post deleted",
        type: "success"
      });

      setTimeout(() => {
        setToast({ message: "", type: "" });
      }, 3000);

      refreshFeed();
    }
    catch (error) {
      console.log(error);
    }
  }

  async function addLike(postId) {
    try {
      const res = await api.post("/api/post/addlike", {
        postId: postId,
        userId: props.currentUser.id
      })
      refreshFeed();
    }
    catch (error) {
      console.log(error);
    }
  }

  async function addComment(postId, value) {
    try {
      if (!value.trim()) {
        return;
      }

      if (editingCommentId) {
        await api.post("/api/post/comment/edit", {
          commentId: editingCommentId,
          content: comment,
          userId: props.currentUser.id
        });

        setEditingCommentId(null);
        setComment("");
        await fetchComment(postId);
        await refreshFeed();
        setCommentMenu(null);
        setToast({
          message: "Comment updated successfully",
          type: "success"
        });

        setTimeout(() => {
          setToast({ message: "", type: "" });
        }, 3000)
      } else {
        await api.post("/api/post/addComment", {
          userId: props.currentUser.id,
          postId: postId,
          content: value
        });
        setComment("");
        await fetchComment(postId);
        await refreshFeed();;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchComment(postId) {
    try {
      const result = await api.get(`/api/post/comments/${postId}`);
      setCommentSection(result.data.comment);
    }
    catch (error) {
      console.log(error);
    }
  }

  function editComment(comment) {
    setEditingCommentId(comment.id);
    setComment(comment.comment);
    setCommentMenu(null);
  }

  async function deleteComment(commentId, postId) {
    try {
      await api.post("/api/post/comment/delete", {
        commentId,
        postId,
        userId: props.currentUser.id
      });
      setCommentMenu(null);
      await fetchComment(postId);
      await refreshFeed();;
    }
    catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="community-page">
      <h1 className="page-title">Community</h1>

      <div className="community-tabs">

        <button
          className={feed === "general" ? "active" : ""}
          onClick={() => setFeed("general")}
        >
          General
        </button>

        <button
          className={feed === "following" ? "active" : ""}
          onClick={() => setFeed("following")}
        >
          Following
        </button>

        <button
          className={feed === "mine" ? "active" : ""}
          onClick={() => setFeed("mine")}
        >
          My Posts
        </button>

      </div>

      <div className="community-feed">
        {posts.length === 0 ? (

          <div className="empty-feed">

            <div className="empty-feed-icon">

              {
                feed === "general"
                  ? "🌍"
                  : feed === "following"
                    ? "👥"
                    : "📝"
              }

            </div>

            <h2>

              {
                feed === "general"
                  ? "No Community Posts Yet"
                  : feed === "following"
                    ? "No Posts From Followed Clubs"
                    : "No Posts Yet"
              }

            </h2>

            <p>

              {
                feed === "general"

                  ? "Be the first member to share an update, celebrate a victory, or start a football discussion."

                  : feed === "following"

                    ? "Follow other clubs to see their latest posts here."

                    : "Create your first post and share it with the football community."
              }

            </p>

          </div>

        ) : (
          posts.map((post) => (
            <div className="post-card" key={post.id}>
              <div className="post-header">
                <div className="post-avatar">
                  {post.user?.charAt(0)}
                </div>
                <div onClick={() => {

                  if (post.role === "club" && post.club_id) {

                    props.openClub(post.club_id);

                  }

                  if (post.role === "player" && post.player_id) {

                    props.openPlayer(post.player_id);

                  }

                }}>
                  <h4 className="post-user">{post.user}</h4>
                  <span className="post-time">{new Date(post.created_at).toLocaleString()}</span>
                </div>

                <MoreVertIcon
                  className="post-menu-icon"
                  onClick={() =>
                    setPostMenu(postMenu === post.id ? null : post.id)
                  }
                />

                {postMenu === post.id && (
                  <>
                    <div
                      className="overlay"
                      onClick={() => setPostMenu(null)}
                    />

                    {post.user_id === props.currentUser?.id &&
                      <div className="postMenu">
                        <button onClick={() => editPost(post)}>
                          Edit
                        </button>

                        <button onClick={() => deletePost(post.id)}>
                          Delete
                        </button>
                      </div>
                    }
                  </>
                )}

              </div>

              <p className="post-content">{post.content}</p>
              <div className="post-actions">
                <button className="action-btn" onClick={() => { addLike(post.id) }}>
                  {post.liked_by_user
                    ? <FavoriteIcon sx={{ color: "red" }} />
                    : <FavoriteBorderIcon />
                  }
                  <span>{post.like_count}</span>
                </button>

                <button
                  className="action-btn"
                  onClick={() => { setOpenPost(openPost === post.id ? null : post.id); fetchComment(post.id) }}
                >
                  <ChatBubbleOutlineIcon /> <span>{post.comment_count}</span>
                </button>

              </div>

              {openPost === post.id && (
                <div className="comment-section">

                  <div className="comments-list">
                    {commentSection.map((comment) => {
                      return <div className="single-comment" key={comment.id}>
                        <div className="comment-header">
                          <div className="comment-user">
                            {comment.name}
                          </div>

                          {comment.user_id === props.currentUser?.id && (
                            <MoreVertIcon
                              className="comment-menu-icon"
                              onClick={() =>
                                setCommentMenu(
                                  commentMenu === comment.id
                                    ? null
                                    : comment.id
                                )
                              }
                            />
                          )}

                        </div>

                        <div className="comment-text">
                          {comment.comment}
                        </div>

                        {commentMenu === comment.id && (
                          <>
                            <div
                              className="overlay"
                              onClick={() => setCommentMenu(null)}
                            />

                            <div className="commentMenu">
                              <button
                                onClick={() => { editComment(comment) }}
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => deleteComment(comment.id, post.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}

                      </div>
                    })}
                  </div>

                  <div className="comment-input">
                    <input value={comment} onChange={(e) => { setComment(e.target.value) }} />
                    <button onClick={() => { addComment(post.id, comment) }}> {editingCommentId ? "Update" : "Post"} </button>
                  </div>

                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Button
        onClick={displayArea}
        sx={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          minWidth: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#1F3897",
          color: "white",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          zIndex: 1000,
          "&:hover": {
            backgroundColor: "#0094d3"
          }
        }}
      >
        {showInput ? <CloseIcon /> : <AddIcon />}
      </Button>

      <div className="input-area" style={{ display: showInput ? "block" : "none" }}>
        <textarea
          value={inputContent}
          placeholder="Write a post..."
          className="post-textarea"
          rows={1}
          onChange={(e) => {
            setInputContent(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
        />
        <button onClick={sendPost}>Post</button>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}

export default Community;
