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

const users = {};

app.get("/", (req, res) => {
  res.render("detailsform");
});

app.post("/room", (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect("/");
  }
  // rooms[req.body.room] = { users: {} };
  // io.emit("room-created", req.body.room);
  // io.emit("new-user", req.body.room);
  res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  res.render("chat", { rooms: rooms, roomName: "Egesa" });
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
    console.log("rooms: ", users);
    // socket.join(room);
    users[socket.id] = name;
    socket.emit("user-connected", name); //or socket.broadcast.to(room).emit("user-connected", name)
    console.log(`${name} connected`);
  });

  socket.on("send-chat-message", (room, message) => {
    socket.to(room).emit("chat-message", {
      message: message,
      name: users[socket.id],
    });
  });

  socket.on("disconnect", () => {
    console.log("disconnect: ", users);
    console.log("disconnected: ", users[socket.id]);
    // delete users[socket.id];
    console.log("after disconnect: ", users);

    // getUserRooms(socket).forEach((room) => {
    //   console.log(users[socket.id]);
    //   socket.broadcast.emit("user-disconnected", users[socket.id]);
    //   delete users[socket.id];
    // });
  });
});

// function getUserRooms(socket) {
//   return Object.entries(users).reduce((names, [socketId, username]) => {
//     if (users[socket.id]) names.push(username);
//     return names;
//   }, []);
// }
