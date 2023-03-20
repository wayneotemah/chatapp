const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

app.set("views", "views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const rooms = { name: { users: {} } };
// rooms can be enable private or mulicute communication between nodes

app.get("/", (req, res) => {
  return res.render("index", { rooms: rooms });
});

app.post("/room", (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect("/");
  }
  rooms[req.body.room] = { users: {} };
  res.redirect(req.body.room);
  return io.emit("room-created", req.body.room);
});

app.get("/:room", (req, res) => {
  // console.log(rooms[req.params.room]);
  if (!rooms[req.params.room]) {
    return res.redirect("/");
  }
  return res.render("room", { roomName: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("new-user", (room, name) => {
    console.log(room);
    socket.join(room);
    rooms[room].users[socket.id] = name;
    socket.to(room).emit("user-connected", name); //or socket.broadcast.to(room).emit("user-connected", name);
    console.log(`${name} connected`);
  });
  socket.on("send-chat-message", (room, message) => {
    socket.to(room).emit("chat-message", {
      message: message,
      name: rooms[room].users[socket.id],
    });
  });
  socket.on("disconnect", () => {
    getUserRooms(socket).forEach((room) => {
      socket.to(room).emit("user-disconnected", rooms[room].users[socket.id]);
      delete rooms[room].users[socket.id];
    });
  });
});

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [username, room]) => {
    if (room.users[socket.id]) names.push(username);
    return names;
  }, []);
}

server.listen(3000);
