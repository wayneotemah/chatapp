const express = require("express");
const session = require("express-session");
const { pool } = require("./quesriesDev");
const { v4: uuidv4 } = require("uuid");
const flash = require("express-flash");
const { log, timeStamp } = require("console");

const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

app.set("views", "views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(flash());

const sessionMiddleware = session({
  secret: "my-secret",
  resave: false,
  saveUninitialized: false,
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next);
});
app.use(
  session({
    genid: () => uuidv4(),
    secret: "my-secret",
    resave: false,
    saveUninitialized: true,
  })
);

const rooms = {};
// rooms can be enable private or mulicute communication between nodes

const users = {};
const messages = {};

const authMiddleWare = (req, res, next) => {
  if (req.session.name) {
    res.redirect("/dashboard");
  } else {
    next();
  }
};

app.get("/", authMiddleWare, (req, res, next) => {
  res.render("detailsform");
});

app.post("/room", (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect("/");
  }

  pool.query(
    "INSERT INTO users (username) VALUES ($1) RETURNING *",
    [req.body.room.trim()],
    (error, results) => {
      if (error && !`${error.detail}`.match(/already/)) {
        req.flash("error", error.detail);
        return res.redirect("/");
      }
      req.session.name = req.body.room;
      res.redirect("/dashboard");
    }
  );
});

app.get("/dashboard", (req, res) => {
  const username = req.session.name;
  if (!username) {
    return res.redirect("login");
  }

  res.render("chat", { roomName: username });
});

app.get("/:room", (req, res) => {
  if (!rooms[req.params.room]) {
    return res.redirect("/");
  }
  res.render("chat", { roomName: req.params.room, rooms: rooms });
});

server.listen(3000);

io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next);
});

io.on("connection", (socket) => {
  socket.on("new-user", (name) => {
    const sessionId = socket.id;
    pool.query(
      "UPDATE users SET socket_id = $1 WHERE username = $2 RETURNING *",
      [sessionId, name],
      (error, results) => {
        if (error) {
          throw error;
        }
        getAllUsers((dbUsers) => {
          console.log(sessionId);
          socket.emit("store-session", sessionId); // Send the session ID back to the client
          io.sockets.emit("user-connected", name, dbUsers);
        });
      }
    );
  });

  // socket.on("reconnect-user", (sessionId) => {
  //   pool.query(
  //     "SELECT username FROM users WHERE socket_id = $1",
  //     [sessionId],
  //     (error, results) => {
  //       if (error) {
  //         throw error;
  //       }
  //     }
  //   );

  //   const name = getUserBySessionId(sessionId); // Get the user's name based on their session ID
  //   if (name) {
  //     users[name] = sessionId;
  //     io.sockets.emit("user-reconnected", name, users);
  //   } else {
  //     // Handle the case where the user's session has expired or is invalid
  //     socket.emit("session-expired");
  //   }
  // });

  socket.on("send-chat-message", (receiver, message, sender) => {
    const senderName = sender;
    const [name1, name2] = [receiver, senderName].sort();
    const roomName = `${name1}_${name2}`;
    var timeStamp = new Date();

    pool.query(
      "INSERT INTO messages (roomname,sender,receiver,message,timestamp) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [roomName, senderName, receiver, message, timeStamp],
      (error, results) => {
        if (error) {
          throw error;
        }
        getSessionIDbyUsername(receiver, (receiver_sessionId) => {
          let messageObject = trimSpaces(results.rows);
          socket
            .to(receiver_sessionId[0].socket_id.trim())
            .emit("chat-message", JSON.stringify(messageObject));
        });
      }
    );
  });

  socket.on("messages-request", (sender, receiver) => {
    const [name1, name2] = [sender, receiver].sort();
    const roomName = `${name1}_${name2}`;

    pool.query(
      "SELECT * FROM messages WHERE roomname = $1 Order by timestamp ASC",
      [roomName],
      (error, results) => {
        if (error) {
          throw error;
        }

        getSessionIDbyUsername(sender, (sender_sessionId) => {
          // console.log(results.rows);
          // console.log(roomName);

          io.to(sender_sessionId[0].socket_id).emit(
            "messages-response",
            results.rows.length > 0 ? results.rows : []
          );
        });
      }
    );
  });

  socket.on("disconnect", () => {
    const key = getNameBySocketId(users, socket.id);
    delete users[key];
    io.sockets.emit("user-disconnected", key, users);
  });
});

function getUserBySessionId(sessionId) {
  for (const [name, id] of Object.entries(users)) {
    if (id === sessionId) {
      return name;
    }
  }
  return null;
}

function getNameBySocketId(obj, value) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] === value) {
      return key;
    }
  }
}

// queries
function getAllUsers(cb) {
  pool.query("SELECT username FROM users", (error, results) => {
    if (error) {
      throw error;
    }
    cb(trimSpaces(results.rows));
  });
}

function getSessionIDbyUsername(name, cb) {
  pool.query(
    "SELECT socket_id FROM users WHERE username = $1",
    [name],
    (error, results) => {
      if (error) {
        throw error;
      }
      cb(trimSpaces(results.rows));
    }
  );
}

function trimSpaces(objectList) {
  let finalList = [];
  if (objectList.length <= 0) {
    return [{}];
  }
  objectList.forEach((object) => {
    let newObject = {};
    console.log(object);
    Object.entries(object).forEach(([key, value]) => {
      newObject[key] = value.trim();
    });
    finalList.push(newObject);
  });
  return finalList;
}
