const socket = io();
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
    notifications(data.message, data.name);
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

socket.on("messages-response", (messages) => {
  messages.forEach((message) => {
    if (message.sender == document.getElementById("username").textContent) {
      appendMessage(message.message, (tag = "my_msg"));
    } else {
      appendMessage(message.message, (tag = "friend_msg"));
    }
  });
});

function appendMessage(message, tag = "friend_msg") {
  messageContainer.innerHTML += `<div class="message ${tag}">
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
      document.querySelector("#receiver").textContent =
        e.target.textContent.trim();
      socket.emit(
        "messages-request",
        document.getElementById("username").textContent,
        e.target.textContent.trim()
      );
      messageContainer.innerHTML = "";
    });
  });
}

function notifications(message, sender) {
  if (Notification.permission === "granted") {
    const notification = new Notification(`New Message From ${sender}`, {
      body: message,
      icon: "path/to/notification-icon.png",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        const notification = new Notification(`New Message From ${sender}`, {
          body: message,
          icon: "path/to/notification-icon.png",
        });
      }
    });
  }
}
