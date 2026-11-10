// Theme Toggle Logic snippet
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved theme preference or default to dark
const currentTheme = localStorage.getItem('theme') || 'dark';
if (currentTheme === 'light') {
  body.classList.add('light-theme');
}

themeToggleBtn.addEventListener('click', () => {
  body.classList.toggle('light-theme');
  
  // Save preference
  let theme = 'dark';
  if (body.classList.contains('light-theme')) {
    theme = 'light';
  }
  localStorage.setItem('theme', theme);
});