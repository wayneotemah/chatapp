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
      username
    );
    messageInput.value = "";
    let date = new Date();

    messageContainer.innerHTML += `<div class="message my_msg">
                                    <p>${message} <br /><span>${
      date.getHours() + ":" + date.getMinutes()
    }</span></p>
                                  </div>`;
  });
}

socket.on("chat-message", (data) => {
  data = JSON.parse(data)[0];
  let time = new Date(data.timestamp);
  if (data.sender == document.querySelector("#receiver").textContent) {
    appendMessage(data.message, `${time.getHours() + ":" + time.getMinutes()}`);
  } else {
    notifications(data.message, data.sender);
  }
});

socket.on("user-connected", (name, users) => {
  roomContainer.innerHTML = "";
  console.log(users);
  console.log(name);
  let yourself = false;
  users.forEach((user) => {
    if (!document.querySelector(`#${user.username}`)) {
      appendUserJoinMessage(`${user.username}`, yourself);
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
    let time = new Date(message.timestamp);
    if (message.sender == document.getElementById("username").textContent) {
      appendMessage(
        message.message,
        `${time.getHours() + ":" + time.getMinutes()}`,
        (tag = "my_msg")
      );
    } else {
      appendMessage(
        message.message,
        `${time.getHours() + ":" + time.getMinutes()}`,
        (tag = "friend_msg")
      );
    }
  });
});

function appendMessage(message, time, tag = "friend_msg") {
  messageContainer.innerHTML += `<div class="message ${tag}">
                                  <p>${message} <br /><span>${time}</span></p>
                                </div>`;
}

function appendUserJoinMessage(name, yourself = false) {
  roomContainer.innerHTML += `<div id = "${name}" class="block active">
                                <div class="details">
                                    <div class="listHead">
                                      <h4>${name}</h4> <span>${
    name == document.getElementById("username").textContent ? "Yourself" : ""
  }</span>
                                     
                                    </div>
                                </div>
                              </div>
                              `;
  [...document.querySelectorAll(".chatlist .block")].forEach((block) => {
    block.addEventListener("click", (e) => {
      document.querySelector("#receiver").textContent = e.target
        .querySelector(".details .listHead h4")
        .textContent.trim();
      socket.emit(
        "messages-request",
        document.getElementById("username").textContent,
        e.target.querySelector("h4").textContent.trim()
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
