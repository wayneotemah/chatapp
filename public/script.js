const socket = io("http://localhost:3000");
const messageContainer = document.getElementById("message-container");
const roomContainer = document.getElementById("room-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const usernameForm = document.getElementById("getUserName");

if (messageForm != null) {
  username = document.getElementById("username").textContent;
  socket.emit("new-user", username);

  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageInput.value;
    socket.emit(
      "send-chat-message",
      document.querySelector("#receiver").textContent,
      message,
      localStorage.getItem("sessionId")
    );
    messageInput.value = "";

    messageContainer.innerHTML += `<div class="message my_msg">
                                    <p>${message} <br /><span>12:18</span></p>
                                  </div>`;
  });
}

socket.on("room-created", (room) => {
  appendUserJoinMessage(room);
});

socket.on("chat-message", (data) => {
  if (data.name == document.querySelector("#receiver").textContent) {
    appendMessage(`${data.message}`);
  } else {
    alert(`${data.name} wants to chat with you`);
  }
});

socket.on("user-connected", (name, rooms) => {
  roomContainer.innerHTML = "";
  Object.keys(rooms).forEach((room) => {
    if (room != document.getElementById("username").textContent) {
      if (!document.querySelector(`#${room}`)) {
        appendUserJoinMessage(`${room}`);
      }
    }
  });
});

socket.on("connect", () => {
  const sessionId = localStorage.getItem("sessionId");
  if (sessionId) {
    socket.emit("reconnect-user", sessionId);
  } else {
    socket.emit("new-user", name);
  }
});

socket.on("store-session", (sessionId) => {
  localStorage.setItem("sessionId", sessionId);
});

socket.on("user-disconnected", (name, users) => {
  const elementToRemove = document.getElementById(name);
  elementToRemove.remove();
});

function appendMessage(message) {
  messageContainer.innerHTML += `<div class="message friend_msg">
                                  <p>${message} <br /><span>12:18</span></p>
                                </div>`;
}

function appendUserJoinMessage(name) {
  roomContainer.innerHTML += `<div id = "${name}" class="block active">
                                <div class="details">
                                    <div class="listHead">
                                      <h4>${name}</h4>
                                    </div>
                                </div>
                              </div>
                              `;
  [...document.querySelectorAll(".chatlist .block")].forEach((block) => {
    block.addEventListener("click", (e) => {
      // console.log(e.target.textContent.trim());
      document.querySelector("#receiver").textContent =
        e.target.textContent.trim();
      alert(e.target.id);
    });
  });
}
