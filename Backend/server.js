import express from "express";
import cors from "cors";
import axios from "axios";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = 4000;
dotenv.config();
const football_api = process.env.FOOTBALL_NEWS_API;

io.on("connection", (socket) => {
  socket.on("joinClub", (clubId) => {

    socket.join(`club-${clubId}`);

    console.log(
      socket.id,
      "joined",
      `club-${clubId}`
    );

  });

});

const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "football",
  password: "12345678",
  port: 5432,
});

app.use(cors());
app.use(express.json());

const BRACKETS = {

  4: {
    1: { nextMatch: 3, position: 1 },
    2: { nextMatch: 3, position: 2 }
  },

  8: {
    1: { nextMatch: 5, position: 1 },
    2: { nextMatch: 5, position: 2 },
    3: { nextMatch: 6, position: 1 },
    4: { nextMatch: 6, position: 2 },
    5: { nextMatch: 7, position: 1 },
    6: { nextMatch: 7, position: 2 }
  },

  16: {
    1: { nextMatch: 9, position: 1 },
    2: { nextMatch: 9, position: 2 },

    3: { nextMatch: 10, position: 1 },
    4: { nextMatch: 10, position: 2 },

    5: { nextMatch: 11, position: 1 },
    6: { nextMatch: 11, position: 2 },

    7: { nextMatch: 12, position: 1 },
    8: { nextMatch: 12, position: 2 },

    9: { nextMatch: 13, position: 1 },
    10: { nextMatch: 13, position: 2 },

    11: { nextMatch: 14, position: 1 },
    12: { nextMatch: 14, position: 2 },

    13: { nextMatch: 15, position: 1 },
    14: { nextMatch: 15, position: 2 }
  },

  32: {
    1: { nextMatch: 17, position: 1 },
    2: { nextMatch: 17, position: 2 },

    3: { nextMatch: 18, position: 1 },
    4: { nextMatch: 18, position: 2 },

    5: { nextMatch: 19, position: 1 },
    6: { nextMatch: 19, position: 2 },

    7: { nextMatch: 20, position: 1 },
    8: { nextMatch: 20, position: 2 },

    9: { nextMatch: 21, position: 1 },
    10: { nextMatch: 21, position: 2 },

    11: { nextMatch: 22, position: 1 },
    12: { nextMatch: 22, position: 2 },

    13: { nextMatch: 23, position: 1 },
    14: { nextMatch: 23, position: 2 },

    15: { nextMatch: 24, position: 1 },
    16: { nextMatch: 24, position: 2 },

    17: { nextMatch: 25, position: 1 },
    18: { nextMatch: 25, position: 2 },

    19: { nextMatch: 26, position: 1 },
    20: { nextMatch: 26, position: 2 },

    21: { nextMatch: 27, position: 1 },
    22: { nextMatch: 27, position: 2 },

    23: { nextMatch: 28, position: 1 },
    24: { nextMatch: 28, position: 2 },

    25: { nextMatch: 29, position: 1 },
    26: { nextMatch: 29, position: 2 },

    27: { nextMatch: 30, position: 1 },
    28: { nextMatch: 30, position: 2 },

    29: { nextMatch: 31, position: 1 },
    30: { nextMatch: 31, position: 2 }
  }

};

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
    console.log({
      club_id,
      user_id
    });

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

    const playerResult = await db.query(
      `SELECT id
   FROM players
   WHERE user_id = $1`,
      [user_id]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Player profile not found."
      });
    }

    const playerId = playerResult.rows[0].id;

    console.log("User ID:", user_id);
    console.log("User:", userResult.rows[0]);
    console.log("Player ID:", playerId);

    const existingReq = await db.query(
      `SELECT id
   FROM club_join_requests
   WHERE player_id = $1
   AND club_id = $2
   AND status IN ('pending','accepted')`,
      [playerId, club_id]
    );

    console.log(existingReq.rows);

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

    console.log(playerClub.rows);

    if (playerClub.rows.length > 0 && playerClub.rows[0].club_id !== null) {
      return res.status(400).json({
        success: false,
        message: "Already in a club"
      });
    }

    const joinReqResult = await db.query(
      `INSERT INTO club_join_requests
        (player_id, club_id, status)
        VALUES ($1, $2, 'pending')
        RETURNING id`,
      [playerId, club_id]
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

    const playerUser = await db.query(
      `
      SELECT user_id
      FROM players
      WHERE id=$1
      `,
      [player_id]
    );

    const playerUserId = playerUser.rows[0].user_id;

    const clubResult = await db.query(
      "SELECT admin_user_id FROM clubs WHERE id = $1",
      [club_id]
    );

    const adminId = clubResult.rows[0].admin_user_id;
    if (adminId != user_id) {
      return res.status(403).json({ success: false });
    }

    if (action == "accept") {
      console.log("Accepting request");
      console.log({
        player_id,
        club_id
      });
      await db.query("UPDATE club_join_requests SET status=$1 WHERE id=$2", ["accepted", requestId]);
      const updateResult = await db.query(
        `UPDATE players
          SET club_id = $1
          WHERE id = $2
          RETURNING *`,
        [club_id, player_id]
      );

      console.log(updateResult.rows);
      await db.query(
        `INSERT INTO notifications (user_id, actor_user_id, message, type)
        VALUES ($1,$2,$3,$4)`,
        [playerUserId, adminId, "Your request was accepted", "club_join_accepted"]
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
        [playerUserId, adminId, "Your request was declined", "club_join_declined"]
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

// Create Tournament
app.post("/api/tournament/create", async (req, res) => {
  try {
    const {
      hostClubId,
      title,
      description,
      location,
      registrationDeadline,
      startDate,
      endDate,
      maxTeams
    } = req.body;

    // Validation
    if (
      !hostClubId ||
      !title ||
      !location ||
      !registrationDeadline ||
      !startDate ||
      !endDate ||
      !maxTeams
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date"
      });
    }

    if (new Date(registrationDeadline) > new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline must be before tournament start date"
      });
    }

    if (maxTeams < 2) {
      return res.status(400).json({
        success: false,
        message: "Tournament must allow at least 2 teams"
      });
    }

    const tournament = await db.query(
      `INSERT INTO tournaments
      (
        host_club_id,
        title,
        description,
        location,
        registration_deadline,
        start_date,
        end_date,
        max_teams
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        hostClubId,
        title,
        description,
        location,
        registrationDeadline,
        startDate,
        endDate,
        maxTeams
      ]
    );

    res.json({
      success: true,
      tournament: tournament.rows[0]
    });

  } catch (error) {
    console.log("TOURNAMENT CREATE ERROR:");
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create tournament"
    });
  }
});

// Fetch tournaments
app.get("/api/tournament", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        t.*,
        host.club_name AS host_club,
        winner.club_name AS champion_name
      FROM tournaments t
      JOIN clubs host
      ON t.host_club_id = host.id
      LEFT JOIN clubs winner
      ON t.winner_club_id = winner.id
      ORDER BY t.start_date
    `);

    res.json({
      success: true,
      tournaments: result.rows
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tournaments"
    });
  }
});

//register clubs for the tournament
app.post("/api/tournament/register", async (req, res) => {
  try {
    const { clubId, tournamentId } = req.body;

    const existing = await db.query(
      `SELECT *
       FROM tournament_registrations
       WHERE tournament_id = $1
       AND club_id = $2`,
      [tournamentId, clubId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Club already registered"
      });
    }

    await db.query(
      `INSERT INTO tournament_registrations
       (tournament_id, club_id)
       VALUES ($1, $2)`,
      [tournamentId, clubId]
    );

    res.json({
      success: true,
      message: "Tournament registration successful"
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

//get registered club for a tournament
app.get("/api/tournament/registeredClub", async (req, res) => {
  try {
    const { tournamentId } = req.query;

    const result = await db.query(
      `SELECT
        c.id,
        c.club_name,
        c.district,
        c.state
      FROM tournament_registrations tr
      JOIN clubs c
          ON tr.club_id = c.id
      WHERE tr.tournament_id = $1
      ORDER BY c.club_name`,
      [tournamentId]
    );

    res.json({
      clubs: result.rows
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
});

// Generate tournament fixtures
app.post("/api/tournament/generateFixtures", async (req, res) => {
  try {
    const { tournamentId } = req.body;

    const clubs = await db.query(
      `SELECT club_id
       FROM tournament_registrations
       WHERE tournament_id = $1`,
      [tournamentId]
    );

    const teamIds = clubs.rows.map(team => team.club_id);

    if (teamIds.length < 4) {
      return res.status(400).json({
        message: "At least 4 teams are required."
      });
    }

    if (teamIds.length % 2 !== 0) {
      return res.status(400).json({
        message: "Number of teams must be even."
      });
    }

    const existing = await db.query(
      `SELECT id
       FROM tournament_fixtures
       WHERE tournament_id = $1`,
      [tournamentId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Fixtures have already been generated."
      });
    }

    // Shuffle teams
    for (let i = teamIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [teamIds[i], teamIds[j]] =
        [teamIds[j], teamIds[i]];
    }

    await db.query("BEGIN");

    try {

      let firstRound = "";
      let nextRounds = [];

      switch (teamIds.length) {

        case 4:
          firstRound = "Semi Final";
          nextRounds = [
            { round: "Final", matches: 1 }
          ];
          break;

        case 8:
          firstRound = "Quarter Final";
          nextRounds = [
            { round: "Semi Final", matches: 2 },
            { round: "Final", matches: 1 }
          ];
          break;

        case 16:
          firstRound = "Round of 16";
          nextRounds = [
            { round: "Quarter Final", matches: 4 },
            { round: "Semi Final", matches: 2 },
            { round: "Final", matches: 1 }
          ];
          break;

        case 32:
          firstRound = "Round of 32";
          nextRounds = [
            { round: "Round of 16", matches: 8 },
            { round: "Quarter Final", matches: 4 },
            { round: "Semi Final", matches: 2 },
            { round: "Final", matches: 1 }
          ];
          break;
      }

      let matchNumber = 1;

      // Insert first round
      for (let i = 0; i < teamIds.length; i += 2) {

        await db.query(
          `INSERT INTO tournament_fixtures
          (
            tournament_id,
            round,
            match_number,
            team1_id,
            team2_id,
            status
          )
          VALUES($1,$2,$3,$4,$5,$6)`,
          [
            tournamentId,
            firstRound,
            matchNumber++,
            teamIds[i],
            teamIds[i + 1],
            "Upcoming"
          ]
        );

      }

      // Insert remaining empty rounds
      for (const round of nextRounds) {

        for (let i = 0; i < round.matches; i++) {

          await db.query(
            `INSERT INTO tournament_fixtures
            (
              tournament_id,
              round,
              match_number,
              team1_id,
              team2_id,
              status
            )
            VALUES($1,$2,$3,NULL,NULL,$4)`,
            [
              tournamentId,
              round.round,
              matchNumber++,
              "Upcoming"
            ]
          );

        }

      }

      await db.query("COMMIT");

      res.status(201).json({
        message: "Fixtures generated successfully."
      });

    } catch (err) {

      await db.query("ROLLBACK");
      throw err;

    }

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
});

// Fetch match fixtures
app.get("/api/tournament/fetchFixtures", async (req, res) => {
  try {
    const { tournamentId } = req.query;

    const fixtures = await db.query(
      `SELECT
      tf.id,
      tf.round,
      tf.match_number,
      tf.status,
      tf.team1_id,
      c1.club_name AS team1_name,
      tf.team2_id,
      c2.club_name AS team2_name,
      tf.team1_score,
      tf.team2_score,
      tf.winner_id
    FROM tournament_fixtures tf
    LEFT JOIN clubs c1
        ON tf.team1_id = c1.id
    LEFT JOIN clubs c2
        ON tf.team2_id = c2.id
    WHERE tf.tournament_id = $1
    ORDER BY tf.match_number`,
      [tournamentId]
    );

    res.json({
      fixtures: fixtures.rows
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
});

//match result update
app.post("/api/tournament/matchResult", async (req, res) => {
  try {
    const { match, tournamentId, team1Score, team2Score } = req.body;

    let winnerId;

    if (Number(team1Score) > Number(team2Score)) {
      winnerId = match.team1_id;
    }
    else if (Number(team2Score) > Number(team1Score)) {
      winnerId = match.team2_id;
    }
    else {
      return res.status(400).json({
        message: "Draws are not allowed."
      });
    }

    await db.query(
      `UPDATE tournament_fixtures
       SET
        team1_score = $1,
        team2_score = $2,
        winner_id = $3,
        status = $4
       WHERE id = $5`,
      [
        team1Score,
        team2Score,
        winnerId,
        "Completed",
        match.id
      ]
    );

    const tournament = await db.query(
      `SELECT max_teams
   FROM tournaments
   WHERE id = $1`,
      [tournamentId]
    );

    const maxTeams = tournament.rows[0].max_teams;

    const bracket = BRACKETS[maxTeams];

    if (bracket) {

      const next = bracket[match.match_number];

      if (next) {
        const column =
          next.position === 1
            ? "team1_id"
            : "team2_id";

        await db.query(
          `UPDATE tournament_fixtures
            SET ${column} = $1
            WHERE tournament_id = $2
            AND match_number = $3`,
          [
            winnerId,
            tournamentId,
            next.nextMatch
          ]
        );
      }
    }

    if (match.round === "Final") {
      await db.query(
        `UPDATE tournaments
         SET winner_club_id = $1
         WHERE id = $2`,
        [winnerId, tournamentId]
      );
    }


    res.status(200).json({
      message: "Result updated successfully."
    });
  }
  catch (error) {
    console.log(error);
  }
});

//fetch tournament with id 
app.get("/api/tournament/:id", async (req, res) => {
  try {

    const { id } = req.params;

    const result = await db.query(
      `
      SELECT
        t.*,
        host.club_name AS host_club,
        winner.club_name AS champion_name
      FROM tournaments t
      JOIN clubs host
        ON t.host_club_id = host.id
      LEFT JOIN clubs winner
        ON t.winner_club_id = winner.id
      WHERE t.id = $1
      `,
      [id]
    );

    res.json({
      tournament: result.rows[0]
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
});

// Fetch profile stats
app.get("/api/profile/stats", async (req, res) => {
  try {
    const { userId } = req.query;

    // Get user role
    const user = await db.query(
      `SELECT role
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    // ================= CLUB =================
    if (user.rows[0].role === "club") {

      const stats = await db.query(
        `SELECT
            c.id,
            c.club_name,
            c.founded_year,
            c.description,
            COUNT(DISTINCT p.id) AS players,
            COUNT(DISTINCT tf.id) AS matches,
            COUNT(DISTINCT t.id) AS trophies
        FROM clubs c

        LEFT JOIN players p
          ON p.club_id = c.id

        LEFT JOIN tournament_fixtures tf
          ON tf.team1_id = c.id
          OR tf.team2_id = c.id

        LEFT JOIN tournaments t
          ON t.winner_club_id = c.id

        WHERE c.user_id = $1

        GROUP BY
          c.id,
          c.club_name,
          c.founded_year,
          c.description`,
        [userId]
      );

      return res.json({
        role: "club",
        stats: stats.rows[0]
      });
    }

    // ================= PLAYER =================
    const stats = await db.query(
      `SELECT
          p.position,
          p.bio,
          p.created_at,
          c.club_name
      FROM players p

      LEFT JOIN clubs c
        ON p.club_id = c.id

      WHERE p.user_id = $1`,
      [userId]
    );

    return res.json({
      role: "player",
      stats: stats.rows[0]
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
});

//update club description
app.put("/api/club/description", async (req, res) => {
  try {

    const { userId, description } = req.body;

    await db.query(
      `UPDATE clubs
             SET description = $1
             WHERE user_id = $2`,
      [description, userId]
    );

    res.json({
      message: "Description updated successfully."
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
});

//update bio for players
app.put("/api/player/bio", async (req, res) => {
  try {

    const { userId, bio } = req.body;

    await db.query(
      `UPDATE players
       SET bio = $1
       WHERE user_id = $2`,
      [bio, userId]
    );

    res.json({
      message: "Bio updated successfully."
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
});

//stats in the home page
app.get("/api/home/stats", async (req, res) => {
  try {

    const players = await db.query(
      "SELECT COUNT(*) FROM players"
    );

    const clubs = await db.query(
      "SELECT COUNT(*) FROM clubs"
    );

    const tournaments = await db.query(
      "SELECT COUNT(*) FROM tournaments"
    );

    const friendlies = await db.query(
      "SELECT COUNT(*) FROM friendly_matches"
    );

    res.json({
      players: players.rows[0].count,
      clubs: clubs.rows[0].count,
      tournaments: tournaments.rows[0].count,
      friendlies: friendlies.rows[0].count
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false
    });
  }
});

//send message in chats
app.post("/api/sendMessage", async (req, res) => {
  try {
    const { message, userId, clubId } = req.body;

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty."
      });
    }

    const result = await db.query(
      `INSERT INTO club_messages
        (club_id, sender_id, message)
        VALUES ($1,$2,$3)
        RETURNING
        id,
        club_id,
        sender_id,
        message,
        created_at`,
      [clubId, userId, message]
    );

    const msg = await db.query(
      `SELECT
          cm.id,
          cm.club_id,
          cm.sender_id,
          cm.message,
          cm.created_at,
          u.name
      FROM club_messages cm

      JOIN users u
      ON cm.sender_id = u.id

      WHERE cm.id = $1`,
      [result.rows[0].id]
    );

    const clubResult = await db.query(
      "SELECT club_id FROM players WHERE user_id = $1",
      [userId]
    );

    if (
      clubResult.rows.length === 0 ||
      clubResult.rows[0].club_id === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Player is not in a club."
      });
    }

    const realClubId = clubResult.rows[0].club_id;

    io.to(`club-${realClubId}`).emit(
      "newMessage",
      msg.rows[0]
    );

    res.json({
      success: true,
      message: msg.rows[0]
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false
    });
  }
});

//retrive messgaes
app.get("/api/getMessages", async (req, res) => {
  try {
    const { clubId } = req.query;

    const messages = await db.query(
      `SELECT
        cm.id,
        cm.message,
        cm.created_at,
        cm.sender_id,
        u.name
        FROM club_messages cm
        JOIN users u
        ON cm.sender_id = u.id
        WHERE cm.club_id = $1
        ORDER BY cm.created_at ASC`,
      [clubId]
    );

    res.json({
      success: true,
      messages: messages.rows
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
