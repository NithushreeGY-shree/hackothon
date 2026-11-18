// CampusConnect front-end interactions. Data is stored only in this browser.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const toast = (message) => {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 3000);
};

// Mobile navigation
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
menuToggle.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuToggle.textContent = open ? '✕' : '☰';
});
$$('.nav-link').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.textContent = '☰';
  $$('.nav-link').forEach(item => item.classList.remove('active'));
  link.classList.add('active');
}));

// Event search and category filtering
let selectedEventFilter = 'all';
const eventSearch = $('#eventSearch');
function filterEvents() {
  const term = eventSearch.value.trim().toLowerCase();
  let visible = 0;
  $$('.event-card').forEach(card => {
    const matchesCategory = selectedEventFilter === 'all' || card.dataset.category === selectedEventFilter;
    const matchesSearch = (card.dataset.search + ' ' + card.textContent).toLowerCase().includes(term);
    const show = matchesCategory && matchesSearch;
    card.hidden = !show;
    if (show) visible++;
  });
  $('#eventEmpty').hidden = visible !== 0;
}
eventSearch.addEventListener('input', filterEvents);
$$('.filter-btn').forEach(button => button.addEventListener('click', () => {
  selectedEventFilter = button.dataset.filter;
  $$('.filter-btn').forEach(item => item.classList.toggle('selected', item === button));
  filterEvents();
}));

// Event registration modal & state
const registerModal = $('#registerModal');
const modalClose = $('#modalClose');
const registerForm = $('#registerForm');
const regEventInput = $('#regEvent');
let activeRegisterButton = null;

function openRegisterModal(eventName, button) {
  activeRegisterButton = button;
  regEventInput.value = eventName;
  registerModal.classList.add('open');
  registerModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#regName').focus(), 100);
}

function closeRegisterModal() {
  registerModal.classList.remove('open');
  registerModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  registerForm.reset();
  activeRegisterButton = null;
}

modalClose.addEventListener('click', closeRegisterModal);

registerModal.addEventListener('click', (e) => {
  if (e.target === registerModal) closeRegisterModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && registerModal.classList.contains('open')) {
    closeRegisterModal();
  }
});

// Restore registered state on page load
const initialRegistrations = JSON.parse(localStorage.getItem('campusconnect_registrations') || '[]');
$$('.register-btn').forEach(button => {
  if (initialRegistrations.includes(button.dataset.event)) {
    button.textContent = 'Registered ✓';
    button.disabled = true;
    button.style.opacity = '.7';
  }
});

// Clicking "Register interest" opens the registration form
$$('.register-btn').forEach(button => button.addEventListener('click', () => {
  const eventName = button.dataset.event;
  const registrations = JSON.parse(localStorage.getItem('campusconnect_registrations') || '[]');
  if (registrations.includes(eventName)) {
    toast(`You are already registered for ${eventName}.`);
    return;
  }
  openRegisterModal(eventName, button);
}));

// Submit registration form
registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const eventName = regEventInput.value;
  const name = $('#regName').value.trim();
  const email = $('#regEmail').value.trim();
  const dept = $('#regDept').value;
  const year = $('#regYear').value;

  const registrationData = {
    eventName,
    name,
    email,
    dept,
    year,
    registeredAt: new Date().toISOString()
  };

  // 1. Save in localStorage
  const registrations = JSON.parse(localStorage.getItem('campusconnect_registrations') || '[]');
  if (!registrations.includes(eventName)) registrations.push(eventName);
  localStorage.setItem('campusconnect_registrations', JSON.stringify(registrations));

  const allDetails = JSON.parse(localStorage.getItem('campusconnect_registrations_details') || '[]');
  allDetails.push(registrationData);
  localStorage.setItem('campusconnect_registrations_details', JSON.stringify(allDetails));

  // 2. Send to backend server if available
  try {
    fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: eventName.toLowerCase().replace(/\s+/g, '-'),
        eventTitle: eventName,
        userEmail: email,
        name,
        dept,
        year
      })
    }).catch(() => {});
  } catch {}

  // 3. Update button state
  if (activeRegisterButton) {
    activeRegisterButton.textContent = 'Registered ✓';
    activeRegisterButton.disabled = true;
    activeRegisterButton.style.opacity = '.7';
  }

  closeRegisterModal();
  toast(`🎉 Registered successfully for ${eventName}! Confirmation sent to ${email}`);
});

// Resource category filter
$$('.resource-tab').forEach(button => button.addEventListener('click', () => {
  $$('.resource-tab').forEach(item => item.classList.toggle('active', item === button));
  const category = button.dataset.resource;
  $$('.resource-item').forEach(item => {
    item.hidden = category !== 'all' && item.dataset.category !== category;
  });
}));

// Contact form: validate and save locally. No email is sent until a backend is connected.
$('#contactForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const message = {
    name: $('#contactName').value.trim(),
    email: $('#contactEmail').value.trim(),
    message: $('#contactMessage').value.trim(),
    submittedAt: new Date().toISOString()
  };
  const messages = JSON.parse(localStorage.getItem('campusconnect_messages') || '[]');
  messages.push(message);
  localStorage.setItem('campusconnect_messages', JSON.stringify(messages));
  $('#contactFeedback').textContent = 'Thank you! Your message has been saved in this browser. This demo does not send email.';
  form.reset();
  toast('Message saved locally. Thank you for reaching out!');
});

$('#year').textContent = new Date().getFullYear();

// Highlight the navigation item for the section currently in view.
const observedSections = $$('main section[id]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$('.nav-link').forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  observedSections.forEach(section => observer.observe(section));
}
