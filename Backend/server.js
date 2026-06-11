import express from "express";
import cors from "cors";
import axios from "axios";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

const app = express();
const PORT = 4000;
dotenv.config();
const football_api = process.env.FOOTBALL_NEWS_API;

const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "football",
  password: "12345678",
  port: 5432,
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// register
app.post("/api/register", async (req, res) => {
  try {
    const { role, name, email, password, position, state, district } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const exists = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const userResult = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, email, passwordHash, role]
    );

    const userId = userResult.rows[0].id;

    if (role === "player") {
      await db.query(
        `INSERT INTO players (user_id, player_name, position, state, district)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, name, position, state, district]
      );
    }

    if (role === "club") {
      await db.query(
        `INSERT INTO clubs (user_id, admin_user_id, club_name, state, district)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, userId, name, state, district]
      );
    }

    res.json({
      success: true,
      user: {
        id: userId,
        name,
        role,
        state,
        district,
        position: role === "player" ? position : null
      }
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});


// login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const baseUser = result.rows[0];

    const isMatch = await bcrypt.compare(password, baseUser.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    let profileData = {
      state: null,
      district: null,
      position: null,
      club_id: null,
      club_name: null
    };

    if (baseUser.role === "player") {
      const p = await db.query(
        `SELECT state, district, position, club_id 
         FROM players WHERE user_id = $1`,
        [baseUser.id]
      );

      if (p.rows.length > 0) {
        profileData = p.rows[0];
      }
    }

    if (baseUser.role === "club") {
      const c = await db.query(
        `SELECT
      id AS club_id,
      club_name,
      state,
      district
    FROM clubs
    WHERE user_id = $1`,
        [baseUser.id]
      );

      if (c.rows.length > 0) {
        profileData.club_id = c.rows[0].club_id;
        profileData.club_name = c.rows[0].club_name;
        profileData.state = c.rows[0].state;
        profileData.district = c.rows[0].district;
      }
    }

    res.json({
      success: true,
      user: {
        id: baseUser.id,
        name: baseUser.name,
        role: baseUser.role,
        user_club_id: profileData.club_id,
        user_club_name: profileData.club_name,
        state: profileData.state,
        district: profileData.district,
        position: profileData.position,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

//create posts
app.post("/api/posts", async (req, res) => {
  try {
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing userId or content"
      });
    }

    const result = await db.query(
      "INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING id, created_at",
      [userId, content]
    );

    res.json({
      success: true,
      post: {
        id: result.rows[0].id,
        content,
        created_at: result.rows[0].created_at
      }
    });

  } catch (err) {
    console.error("POST CREATE ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to create post"
    });
  }
});

//get posts
app.get("/api/posts", async (req, res) => {
  try {
    const { userId } = req.query;

    const result = await db.query(
      `SELECT
          posts.id,
          posts.user_id,
          posts.content,
          posts.created_at,
          users.name AS user,
          COUNT(DISTINCT post_likes.id) AS like_count,
          COUNT(DISTINCT post_comments.id) AS comment_count,
          EXISTS (
            SELECT 1
            FROM post_likes pl2
            WHERE pl2.post_id = posts.id
            AND pl2.user_id = $1
          ) AS liked_by_user
        FROM posts
        JOIN users
          ON users.id = posts.user_id
        LEFT JOIN post_likes
          ON post_likes.post_id = posts.id
        LEFT JOIN post_comments
          ON post_comments.post_id = posts.id
        GROUP BY posts.id, users.name
        ORDER BY posts.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      posts: result.rows
    });

  } catch (err) {
    console.error("FETCH POSTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts"
    });
  }
});

//news
app.get("/api/news", async (req, res) => {
  try {

    // 🇮🇳 Indian Football
    const indianRes = await axios.get(
      `https://newsdata.io/api/1/latest?apikey=${football_api}&q=isl OR "indian football team" OR "india football" OR aiff OR "i-league"&country=in&language=en&category=sports&image=1&removeduplicate=1`
    );

    // 🌍 Global Football
    const globalRes = await axios.get(
      `https://newsdata.io/api/1/latest?apikey=${football_api}&q=football OR soccer OR fifa OR uefa OR "champions league" OR "premier league"&language=en&category=sports&image=1&removeduplicate=1`
    );

    res.json({
      indian: indianRes.data.results || [],
      global: globalRes.data.results || []
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch football news" });
  }
});

//club
app.get("/api/clubs", async (req, res) => {
  try {
    const { state, district, userId } = req.query;

    let myClubId = null;

    if (userId) {
      const myClub = await db.query(
        "SELECT id FROM clubs WHERE user_id=$1",
        [userId]
      );

      myClubId = myClub.rows[0]?.id;
    }

    let local = { rows: [] };
    let stateClubs = { rows: [] };

    if (state && district) {
      local = await db.query(`
        SELECT
          c.*,
          COUNT(p.user_id) AS player_count,

          EXISTS (
            SELECT 1
            FROM club_follows cf
            WHERE cf.follower_club_id = $3
            AND cf.followed_club_id = c.id
          ) AS is_following

        FROM clubs c
        LEFT JOIN players p
          ON p.club_id = c.id
        WHERE c.state = $1
          AND c.district = $2
        GROUP BY c.id
      `, [state, district, myClubId]);

      stateClubs = await db.query(`
        SELECT
          c.*,
          COUNT(p.user_id) AS player_count,

          EXISTS (
            SELECT 1
            FROM club_follows cf
            WHERE cf.follower_club_id = $2
            AND cf.followed_club_id = c.id
          ) AS is_following

        FROM clubs c
        LEFT JOIN players p
          ON p.club_id = c.id
        WHERE c.state = $1
        GROUP BY c.id
      `, [state, myClubId]);
    }

    const national = await db.query(`
      SELECT
        c.*,
        COUNT(p.user_id) AS player_count,

        EXISTS (
          SELECT 1
          FROM club_follows cf
          WHERE cf.follower_club_id = $1
          AND cf.followed_club_id = c.id
        ) AS is_following

      FROM clubs c
      LEFT JOIN players p
        ON p.club_id = c.id
      GROUP BY c.id
    `, [myClubId]);

    res.json({
      success: true,
      local: local.rows,
      state: stateClubs.rows,
      national: national.rows
    });

  } catch (err) {
    console.error("CLUB FETCH ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clubs"
    });
  }
});


//club join request
app.post("/api/reqclub/:club_id/:user_id", async (req, res) => {
  try {
    const { club_id, user_id } = req.params;

    const roleResult = await db.query(
      "SELECT role FROM users WHERE id = $1",
      [user_id]
    );

    if (roleResult.rows[0].role !== "player") {
      return res.status(400).json({
        success: false,
        message: "Club accounts cannot join clubs"
      });
    }

    const adminResult = await db.query(
      "SELECT admin_user_id FROM clubs WHERE id = $1",
      [club_id]
    );

    const userResult = await db.query(
      "SELECT name FROM users WHERE id = $1",
      [user_id]
    );

    const existingReq = await db.query(
      `SELECT id FROM club_join_requests 
   WHERE player_id = $1 
   AND club_id = $2 
   AND status IN ('pending','accepted')`,
      [user_id, club_id]
    );

    if (existingReq.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Join request already sent"
      });
    }

    const playerClub = await db.query(
      "SELECT club_id FROM players WHERE user_id = $1",
      [user_id]
    );

    if (playerClub.rows.length > 0 && playerClub.rows[0].club_id !== null) {
      return res.status(400).json({
        success: false,
        message: "Already in a club"
      });
    }

    const joinReqResult = await db.query(
      "INSERT INTO club_join_requests (player_id, club_id, status) VALUES ($1, $2, 'pending') RETURNING id",
      [user_id, club_id]
    );

    const requestId = joinReqResult.rows[0].id;

    await db.query(
      "INSERT INTO notifications (user_id, actor_user_id,request_id, message, type) VALUES ($1, $2, $3, $4, $5)",
      [
        adminResult.rows[0].admin_user_id,
        user_id,
        requestId,
        `${userResult.rows[0].name} wants to join your club`,
        "club_join_request"
      ]
    );

    res.json({
      success: true,
      message: "Join request sent"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

//get notifications
app.get("/api/notifications/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await db.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [user_id]
    );

    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

//Join request operation
app.post("/api/club/request/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, user_id } = req.body;

    const reqResult = await db.query(
      `SELECT player_id, club_id, status
       FROM club_join_requests
       WHERE id = $1`,
      [requestId]
    );

    if (reqResult.rows.length === 0)
      return res.status(404).json({ success: false });

    if (reqResult.rows[0].status !== "pending")
      return res.status(400).json({ success: false, message: "Already processed" });

    const { player_id, club_id } = reqResult.rows[0];

    const clubResult = await db.query(
      "SELECT admin_user_id FROM clubs WHERE id = $1",
      [club_id]
    );

    const adminId = clubResult.rows[0].admin_user_id;
    if (adminId != user_id) {
      return res.status(403).json({ success: false });
    }

    if (action == "accept") {

      await db.query("UPDATE club_join_requests SET status=$1 WHERE id=$2", ["accepted", requestId]);
      await db.query("UPDATE players SET club_id=$1 WHERE user_id=$2", [club_id, player_id]);
      await db.query(
        `INSERT INTO notifications (user_id, actor_user_id, message, type)
   VALUES ($1,$2,$3,$4)`,
        [player_id, adminId, "Your request was accepted", "club_join_accepted"]
      );
      await db.query(
        "DELETE FROM notifications WHERE request_id = $1",
        [requestId]
      );
      await db.query(
        "UPDATE club_join_requests SET status = 'denied' WHERE player_id = $1 AND id != $2",
        [player_id, requestId]
      );

    } else if (action == "decline") {

      await db.query("UPDATE club_join_requests SET status=$1 WHERE id=$2", ["denied", requestId]);
      await db.query(
        `INSERT INTO notifications (user_id, actor_user_id, message, type)
   VALUES ($1,$2,$3,$4)`,
        [player_id, adminId, "Your request was declined", "club_join_declined"]
      );
      await db.query(
        "DELETE FROM notifications WHERE request_id = $1",
        [requestId]
      );

    } else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }

});

app.get("/api/player/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const clubResult = await db.query(
      "SELECT id FROM clubs WHERE user_id = $1",
      [user_id]
    );

    if (clubResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }

    const clubId = clubResult.rows[0].id;

    const club_members = await db.query(
      "SELECT * FROM players WHERE club_id = $1",
      [clubId]
    );

    res.json({
      success: true,
      players: club_members.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false
    });
  }
});

//edit post
app.post("/api/post/edit", async (req, res) => {
  try {
    const { postId, value, userId } = req.body;

    const updatedPost = await db.query(`UPDATE posts SET content=$1 WHERE user_id=$2 AND id=$3 RETURNING *`, [value, userId, postId]);

    if (updatedPost.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Post not found or not yours"
      });
    }

    res.json({
      success: true,
      post: updatedPost.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }

});

//delete post
app.post("/api/post/delete", async (req, res) => {
  try {
    const { postId, userId } = req.body;

    const result = await db.query(
      "DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *",
      [postId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false
      });
    }

    res.json({
      success: true
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false
    });
  }
});

//add like
app.post("/api/post/addlike", async (req, res) => {
  try {
    const { postId, userId } = req.body;

    const searchLike = await db.query(
      "SELECT * FROM post_likes WHERE post_id=$1 AND user_id=$2",
      [postId, userId]
    );

    if (searchLike.rows.length > 0) {

      await db.query(
        "DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2",
        [postId, userId]
      );

      const countLike = await db.query(
        "SELECT COUNT(*) AS count FROM post_likes WHERE post_id=$1",
        [postId]
      );

      return res.json({
        success: true,
        liked: false,
        count: countLike.rows[0].count
      });
    }

    await db.query(
      "INSERT INTO post_likes (post_id,user_id) VALUES ($1,$2)",
      [postId, userId]
    );

    const countLike = await db.query(
      "SELECT COUNT(*) AS count FROM post_likes WHERE post_id=$1",
      [postId]
    );

    res.json({
      success: true,
      liked: true,
      count: countLike.rows[0].count
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false
    });
  }
});

//add comment
app.post("/api/post/addComment", async (req, res) => {
  try {
    const { userId, postId, content } = req.body;

    const addedComment = await db.query("INSERT INTO post_comments (post_id,user_id,comment) VALUES ($1,$2,$3) RETURNING *", [postId, userId, content]);

    if (addedComment.rows.length === 0) {
      return res.json({
        success: false,
        message: "Unable to add comment"
      });
    }

    return res.json({
      success: true,
      comment: addedComment.rows[0]
    });
  } catch (error) {
    console.log(error);
  }
});

//get comments
app.get("/api/post/comments/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await db.query(`
      SELECT
        post_comments.id,
        post_comments.user_id,
        post_comments.comment,
        post_comments.created_at,
        users.name
      FROM post_comments
      JOIN users
        ON users.id = post_comments.user_id
      WHERE post_comments.post_id = $1
      ORDER BY post_comments.created_at DESC
    `, [postId]);

    res.json({
      success: true,
      comment: comments.rows
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false
    });
  }
});

//edit comment
app.post("/api/post/comment/edit", async (req, res) => {
  try {
    const { commentId, content, userId } = req.body;

    await db.query(
      "UPDATE post_comments SET comment=$1 WHERE id=$2 AND user_id=$3",
      [content, commentId, userId]
    );

    res.json({
      success: true
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false
    });
  }
});

//delete comment
app.post("/api/post/comment/delete", async (req, res) => {
  try {
    const { commentId, postId, userId } = req.body;

    const result = await db.query(
      `DELETE FROM post_comments
       WHERE id=$1
       AND post_id=$2
       AND user_id=$3
       RETURNING *`,
      [commentId, postId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Comment not found or not yours"
      });
    }

    res.json({
      success: true
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false
    });
  }
});

//follow club
app.post("/api/club/follow", async (req, res) => {
  try {
    console.log("FOLLOW REQUEST:", req.body);
    const { userId, clubId } = req.body;

    const myClub = await db.query(
      "SELECT id FROM clubs WHERE user_id=$1",
      [userId]
    );

    if (myClub.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Club not found"
      });
    }
    const followerClubId = myClub.rows[0].id;

    if (followerClubId == clubId) {
      return res.status(400).json({
        success: false,
        message: "Cannot follow your own club"
      });
    }

    const existing = await db.query(
      `SELECT *
       FROM club_follows
       WHERE follower_club_id=$1
       AND followed_club_id=$2`,
      [followerClubId, clubId]
    );

    if (existing.rows.length > 0) {
      await db.query(
        `DELETE FROM club_follows
     WHERE follower_club_id=$1
     AND followed_club_id=$2`,
        [followerClubId, clubId]
      );

      return res.json({
        success: true,
        following: false
      });
    }

    await db.query(
      `INSERT INTO club_follows
   (follower_club_id, followed_club_id)
   VALUES ($1,$2)`,
      [followerClubId, clubId]
    );

    res.json({
      success: true,
      following: true
    });
  }
  catch (error) {
    console.log(error);
    res.status(500).json({
      success: false
    });
  }
});

//get followed clubs by a perticular club
app.get("/api/club/followed/:clubId", async (req, res) => {
  try {
    const { clubId } = req.params;

    const followedClubs = await db.query(`
      SELECT
        c.id,
        c.club_name
      FROM club_follows cf
      JOIN clubs c
        ON c.id = cf.followed_club_id
      WHERE cf.follower_club_id = $1
    `, [clubId]);

    res.json({
      success: true,
      clubs: followedClubs.rows
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false
    });
  }
});

// create friendlies
app.post("/api/friendly/create", async (req, res) => {
  try {
    const {
      userId,
      hostClubId,
      opponentClubId,
      title,
      location,
      matchDate,
      description
    } = req.body;

    if (hostClubId === opponentClubId) {
      return res.status(400).json({
        success: false,
        message: "You cannot challenge your own club"
      });
    }

    const existing = await db.query(
      `SELECT *
       FROM friendly_matches
       WHERE
       (
         (
           host_club_id = $1
           AND opponent_club_id = $2
         )
         OR
         (
           host_club_id = $2
           AND opponent_club_id = $1
         )
       )
       AND status = 'pending'`,
      [hostClubId, opponentClubId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Friendly request already sent"
      });
    }

    const match = await db.query(
      `INSERT INTO friendly_matches
       (
         host_club_id,
         opponent_club_id,
         title,
         location,
         match_date,
         description,
         status
       )
       VALUES
       ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        hostClubId,
        opponentClubId,
        title,
        location,
        matchDate,
        description,
        "pending"
      ]
    );

    console.log("MATCH CREATED:", match.rows[0]);

    const opponent = await db.query(
      "SELECT user_id FROM clubs WHERE id=$1",
      [opponentClubId]
    );

    console.log("Opponent club id:", opponentClubId);
    console.log("Opponent query:", opponent.rows);

    const notif = await db.query(
      `INSERT INTO notifications
       (
         user_id,
         actor_user_id,
         type,
         message,
         friendly_match_id
       )
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        opponent.rows[0].user_id,
        userId,
        "friendly_request",
        `${title} friendly match invitation`,
        match.rows[0].id
      ]
    );

    console.log("NOTIFICATION CREATED:", notif.rows[0]);

    res.json({
      success: true,
      match: match.rows[0]
    });

  } catch (error) {
    console.log("FRIENDLY CREATE ERROR:");
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create friendly request"
    });
  }
});

//friendly req join or reject
app.post("/api/friendly/request/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    console.log("FRIENDLY ACTION");
console.log("ID:", id);
console.log("ACTION:", action);
    if (action === "accept") {
      await db.query(
        `UPDATE friendly_matches
         SET status='accepted'
         WHERE id=$1`,
        [id]
      );
    }

    if (action === "decline") {
      await db.query(
        `UPDATE friendly_matches
         SET status='declined'
         WHERE id=$1`,
        [id]
      );
    }

    await db.query(
      "DELETE FROM notifications WHERE friendly_match_id=$1",
      [id]
    );

    res.json({
      success: true
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false
    });
  }
});

//get firendly matches
app.get("/api/friendly", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        fm.*,
        c1.club_name AS host_club,
        c2.club_name AS opponent_club
      FROM friendly_matches fm
      JOIN clubs c1 ON fm.host_club_id = c1.id
      JOIN clubs c2 ON fm.opponent_club_id = c2.id
      WHERE fm.status = 'accepted'
        AND fm.match_date >= NOW()
      ORDER BY fm.match_date
    `);

    res.json({
      success: true,
      matches: result.rows
    });
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
