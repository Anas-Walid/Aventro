// Theme Toggle

const themeBtn = document.getElementById("theme-toggle");

if(localStorage.getItem("theme") === "light"){
  document.body.classList.add("light-theme");
  themeBtn.textContent = "☀️";
}

themeBtn.addEventListener("click", () => {

  document.body.classList.toggle("light-theme");

  const lightMode =
    document.body.classList.contains("light-theme");

  localStorage.setItem(
    "theme",
    lightMode ? "light" : "dark"
  );

  themeBtn.textContent =
    lightMode ? "☀️" : "🌙";
});


// Counter

let counter = 0;

const counterValue =
  document.getElementById("counter-value");

function updateDisplay(){
  counterValue.textContent = counter;
}

function addTwo(){
  counter += 2;
  updateDisplay();
}

function subtractOne(){
  counter--;
  updateDisplay();
}

function resetCounter(){
  counter = 0;
  updateDisplay();
}

updateDisplay();


// Background Color Generator

function changeColor(){

  const red =
    Math.floor(Math.random() * 256);

  const green =
    Math.floor(Math.random() * 256);

  const blue =
    Math.floor(Math.random() * 256);

  const color =
    `rgb(${red}, ${green}, ${blue})`;

  document.getElementById("bg")
    .style.backgroundColor = color;
}


const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const botResponses = {
  "hi": "Hi! How can I help you?",  
  "hello": "Hi! How can I help you?",
  "Hi": "Hi! How can I help you?",  
  "Hello": "Hi! How can I help you?",
  "bye": "Goodbye!",
  "good bye": "Goodbye!",
  "Bye": "Goodbye!",
  "Good bye": "Goodbye!",
  "Good Bye": "Goodbye!",
  "default": "I didn’t understand that."
};

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function handleUserInput() {
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, "user");
  userInput.value = "";
  const reply = botResponses[text] || botResponses.default;
  setTimeout(() => addMessage(reply, "bot"), 400);
}

sendBtn.onclick = handleUserInput;
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") handleUserInput();
});

const openBtn = document.getElementById("openChatBtn");
const chatPanel = document.getElementById("chatPanel");

openBtn.addEventListener("click", () => {
  chatPanel.classList.toggle("open");
});