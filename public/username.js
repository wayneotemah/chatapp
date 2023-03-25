const socket = io("http://localhost:3000");
const usernameForm = document.getElementById("getUserName");
usernameForm.addEventListener("submit", (e) => {
  const message = document.querySelector('input[name="room"]').value;
  socket.emit("new-user", message);
});
