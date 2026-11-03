// Theme Toggle Switcher
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    themeBtn.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
  });
}

// Accent Color Randomizer demo
const colorBtn = document.getElementById('color-btn');
if (colorBtn) {
  colorBtn.addEventListener('click', () => {
    const accents = ['#f47b20', '#6366f1', '#10b981', '#ec4899', '#8b5cf6'];
    const selected = accents[Math.floor(Math.random() * accents.length)];
    document.documentElement.style.setProperty('--accent-orange', selected);
  });
}


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


