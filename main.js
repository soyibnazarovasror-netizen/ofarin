// ===========================
// OFARIN — main.js
// ===========================

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
}

function applyTheme(theme) {
  const body = document.body;
  const isLight = theme === 'light';
  body.classList.toggle('light-theme', isLight);
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = isLight ? '🌙' : '☀️';
    btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
  });
}

function setTheme(theme) {
  localStorage.setItem('ofarin_theme', theme);
  applyTheme(theme);
}

function toggleTheme() {
  const current = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  setTheme(current === 'light' ? 'dark' : 'light');
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  if (window.scrollY > 40) {
    nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.4)';
  } else {
    nav.style.boxShadow = 'none';
  }
});

// Fade-in on scroll (IntersectionObserver)
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-card, .visual-box, .slot-card, .contact-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  setTheme(localStorage.getItem('ofarin_theme') || 'dark');
});