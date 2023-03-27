const express = require("express");
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

app.set("views", "views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

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

  req.session.name = req.body.room;
  res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  const username = req.session.name;
  if (!username) {
    return res.redirect("login");
  }
  console.log(req.session.name);
  //
  res.render("chat", { rooms: users, roomName: username });
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
    users[name] = sessionId;
    socket.emit("store-session", sessionId); // Send the session ID back to the client
    io.sockets.emit("user-connected", name, users);
  });

  socket.on("reconnect-user", (sessionId) => {
    const name = getUserBySessionId(sessionId); // Get the user's name based on their session ID
    if (name) {
      users[name] = sessionId;
      io.sockets.emit("user-reconnected", name, users);
    } else {
      // Handle the case where the user's session has expired or is invalid
      socket.emit("session-expired");
    }
  });

  socket.on("send-chat-message", (receiver, message, sender) => {
    const senderName = getNameBySocketId(users, sender);
    const [name1, name2] = [receiver, senderName].sort();
    const roomName = `${name1}-${name2}`;

    // Create the room's message array if it doesn't exist
    if (!messages[roomName]) {
      messages[roomName] = [];
    }

    // Add the message to the room's message array
    messages[roomName].push({
      sender: senderName,
      receiver: receiver,
      message: message,
      timestamp: new Date(),
    });

    socket.to(users[receiver]).emit("chat-message", {
      message: message,
      name: senderName,
    });
  });

  socket.on("messages-request", (sender, receiver) => {
    const [name1, name2] = [sender, receiver].sort();
    const roomName = `${name1}-${name2}`;

    io.to(users[sender]).emit(
      "messages-response",
      messages[roomName] ? messages[roomName] : []
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
