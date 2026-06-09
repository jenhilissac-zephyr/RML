// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// Mobile hamburger
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Smooth scroll active highlight
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navAnchors.forEach(a => {
        a.style.color = '';
        if (a.getAttribute('href') === '#' + entry.target.id) {
          a.style.color = 'var(--cream)';
        }
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => observer.observe(s));

// Animate on scroll
const animateOnScroll = () => {
  const elements = document.querySelectorAll('.phase-card, .plan-card, .testi-card, .stat-card, .bonus-card, .ach-card, .diff-item');
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      el.style.opacity = '1';
      el.style.transform = el.style.transform?.includes('translateY(-') ? el.style.transform : 'translateY(0)';
    }
  });
};
document.querySelectorAll('.phase-card, .plan-card, .testi-card, .stat-card, .bonus-card, .diff-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  el.style.transform = 'translateY(20px)';
});
window.addEventListener('scroll', animateOnScroll);
animateOnScroll();

// Registration Form Submit
const form = document.getElementById('registrationForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');
const formError = document.getElementById('formError');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Registering...';
  formSuccess.style.display = 'none';
  formError.style.display = 'none';

  const payload = {
    name: form.name.value,
    email: form.email.value,
    phone: form.phone.value,
    instrument: form.instrument.value,
    level: form.level.value,
    message: form.message.value,
  };

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      formSuccess.style.display = 'block';
      form.reset();
    } else {
      throw new Error(data.message || 'Registration failed');
    }
  } catch (err) {
    formError.style.display = 'block';
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'Secure Your Free Spot Now';
  }
});

// Pause marquee on hover
const track = document.querySelector('.achievements-track');
if (track) {
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
}

// Get next Sunday date

function getNextSunday() {
    const today = new Date();

    let daysUntilSunday = (14 - today.getDay()) % 14;

    const sunday = new Date(today);
    sunday.setDate(today.getDate() + daysUntilSunday);

    return sunday.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const dateElement = document.getElementById('sunday-date');
    if (dateElement) {
        dateElement.textContent = getNextSunday();
    }
});
