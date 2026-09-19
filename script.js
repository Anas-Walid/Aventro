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
