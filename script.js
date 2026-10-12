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