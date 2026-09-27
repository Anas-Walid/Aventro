// Set current year in footer
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Declare the counter
let count = 0;

// Load the counter when the page opens
loadCount();

// Function to display the counter
function updateCount() {
  document.getElementById("count").innerHTML = count;
}

// Function to increase the counter
function increaseCount() {
  count++;
  updateCount();
}

// Function to decrease the counter
function decreaseCount() {
  if (count > 0) {
    count--;
    updateCount();
  }
}

// Function to reset the counter
function resetCount() {
  count = 0;
  updateCount();
}

// Function to save the counter
function saveCount() {
  localStorage.setItem("count", count);
}

// Function to load the counter
function loadCount() {
  let saved = localStorage.getItem("count");
  if (saved !== null) {
    count = Number(saved);
  }
  updateCount();
}


function checkAnswer(button, correct) {
    const result =
        button.parentElement.querySelector(".result");

    if (correct) {
        result.textContent = "✅ Correct!";
        result.style.color = "#22c55e";
    } else {
        result.textContent = "❌ Try Again!";
        result.style.color = "#ef4444";
    }
}

function changeColor(){
    let red = Math.floor(Math.random()*256);
    let green = Math.floor(Math.random()*256);
    let blue = Math.floor(Math.random()*256);
    let color = "rgb("+ red + "," + green + "," + blue + ")";
    document.getElementById(".bg").style.backgroundColor = color;
}


const themeBtn = document.getElementById("theme-toggle");

// Load saved theme
if (localStorage.getItem("theme") === "light") {
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

    themeBtn.textContent = lightMode ? "☀️" : "🌙";
});
