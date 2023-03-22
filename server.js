const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

app.set("views", "views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const rooms = {};
// rooms can be enable private or mulicute communication between nodes

app.get("/", (req, res) => {
  res.render("detailsform");
});

app.post("/room", (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect("/");
  }
  rooms[req.body.room] = { users: {} };
  res.redirect(req.body.room);
  io.emit("room-created", req.body.room);
});

app.get("/:room", (req, res) => {
  if (!rooms[req.params.room]) {
    return res.redirect("/");
  }
  res.render("chat", { roomName: req.params.room, rooms: rooms });
});

server.listen(3000);

io.on("connection", (socket) => {
  socket.on("new-user", ( name) => {
    console.log(rooms);
    // socket.join(room);
    // rooms[room].users[socket.id] = name;
    socket.emit("user-connected", name); //or socket.broadcast.to(room).emit("user-connected", name)
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
      console.log(rooms[room].users[socket.id]);
      socket.broadcast.emit("user-disconnected", rooms[room].users[socket.id]);
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
