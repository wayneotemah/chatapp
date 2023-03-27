const express = require("express");
const session = require("express-session");

const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

app.set("views", "views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

const rooms = {};
// rooms can be enable private or mulicute communication between nodes

const users = {};

app.get("/", (req, res) => {
  res.render("detailsform");
});

app.post("/room", (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect("/");
  }

  req.session.name = req.body.room;

  // rooms[req.body.room] = { users: {} };
  // io.emit("room-created", req.body.room);
  // io.emit("new-user", req.body.room);

  res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  username = req.session.name;
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

io.on("connection", (socket) => {
  socket.on("new-user", (name) => {
    // socket.join(room);
    users[name] = socket.id;
    // socket.broadcast.emit("user-connected", name, users); //or socket.broadcast.to(room).emit("user-connected", name)
    io.sockets.emit("user-connected", name, users);
    // socket.emit("user-connected", name, users); //or socket.broadcast.to(room).emit("user-connected", name)
    //
  });

  socket.on("send-chat-message", (room, message) => {
    socket.to(room).emit("chat-message", {
      message: message,
      name: users[socket.id],
    });
  });

  socket.on("disconnect", () => {
    const key = removePairsByValue(users, socket.id);
    delete users[key];
    io.sockets.emit("user-disconnected", key, users);

    // getUserRooms(socket).forEach((room) => {
    //
    //   delete users[socket.id];
    // });
  });
});

// function getUser(socket) {

//   return Object.entries(reversedObject).reduce((names, [socketId, username]) => {
//     if (users[socket.id]) names.push(username);
//     return names;
//   }, []);
// }

function removePairsByValue(obj, value) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] === value) {
      return key;
    }
  }
}
