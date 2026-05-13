// ===========================
// OFARIN — admin.js
// ===========================

const ADMIN_PASSWORD = 'admin123';

function adminLogin() {
  const pass = document.getElementById('adminPass').value;
  const errEl = document.getElementById('loginErr');
  if (pass === ADMIN_PASSWORD) {
    localStorage.setItem('ofarin_admin_auth', '1');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDash').style.display = 'block';
    loadBookings();
  } else {
    errEl.style.display = 'block';
    document.getElementById('adminPass').value = '';
  }
}

function adminLogout() {
  localStorage.removeItem('ofarin_admin_auth');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminDash').style.display = 'none';
}

function showTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).style.display = 'block';
  event.target.classList.add('active');

  if (tab === 'bookings') loadBookings();
  if (tab === 'contacts') loadContacts();
  if (tab === 'media') loadAdminMedia();
}

// ===== BOOKINGS =====
function loadBookings() {
  const list = document.getElementById('bookingsList');
  if (!list) return;
  const bookings = JSON.parse(localStorage.getItem('ofarin_bookings') || '[]');

  if (bookings.length === 0) {
    list.innerHTML = '<div class="empty-msg">No booking requests yet.</div>';
    return;
  }

  const eventLabels = {
    wedding: "To'y / Wedding",
    birthday: "Tug'ilgan kun / Birthday",
    yubiley: "Yubiley",
    haj: "Haj To'yi",
    banket: "Banket"
  };

  list.innerHTML = bookings.slice().reverse().map((b, ri) => {
    const i = bookings.length - 1 - ri; // real index
    const statusClass = b.status || 'pending';
    const statusLabel = { pending: '⏳ Pending', confirmed: '✅ Confirmed', rejected: '❌ Rejected' }[b.status] || 'Pending';
    const slotLabel = b.slot === 'morning' ? '☀️ Morning (09:00–15:00)' : '🌙 Evening (17:00–23:00)';
    const submitted = b.submitted ? new Date(b.submitted).toLocaleDateString() : '—';

    return `
    <div class="booking-card" id="bcard-${i}">
      <div class="booking-card-header">
        <h4>${b.name}</h4>
        <span class="booking-status ${statusClass}">${statusLabel}</span>
      </div>
      <div class="booking-card-body">
        <span><strong>Date</strong>${b.date}</span>
        <span><strong>Slot</strong>${slotLabel}</span>
        <span><strong>Phone</strong>${b.phone}</span>
        <span><strong>Event</strong>${eventLabels[b.event] || b.event}</span>
        <span><strong>Guests</strong>${b.guests || '—'}</span>
        <span><strong>Submitted</strong>${submitted}</span>
        ${b.note ? `<span style="grid-column:1/-1"><strong>Notes</strong>${b.note}</span>` : ''}
      </div>
      <div class="booking-card-actions">
        <button class="btn-confirm" onclick="updateBooking(${i},'confirmed')">✅ Confirm</button>
        <button class="btn-reject" onclick="updateBooking(${i},'rejected')">❌ Reject</button>
        <button class="btn-delete" onclick="deleteBooking(${i})">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
}

function updateBooking(index, status) {
  const bookings = JSON.parse(localStorage.getItem('ofarin_bookings') || '[]');
  if (bookings[index]) {
    bookings[index].status = status;
    localStorage.setItem('ofarin_bookings', JSON.stringify(bookings));
    loadBookings();
  }
}

function deleteBooking(index) {
  const bookings = JSON.parse(localStorage.getItem('ofarin_bookings') || '[]');
  bookings.splice(index, 1);
  localStorage.setItem('ofarin_bookings', JSON.stringify(bookings));
  loadBookings();
}

function clearBookings() {
  if (confirm('Delete ALL booking requests? This cannot be undone.')) {
    localStorage.removeItem('ofarin_bookings');
    loadBookings();
  }
}

// ===== CONTACTS =====
function loadContacts() {
  const list = document.getElementById('contactsList');
  if (!list) return;
  const contacts = JSON.parse(localStorage.getItem('ofarin_contacts') || '[]');

  if (contacts.length === 0) {
    list.innerHTML = '<div class="empty-msg">No messages yet.</div>';
    return;
  }

  list.innerHTML = contacts.slice().reverse().map((c, ri) => {
    const i = contacts.length - 1 - ri;
    const date = c.date ? new Date(c.date).toLocaleDateString() : '—';
    return `
    <div class="contact-card">
      <div class="booking-card-header">
        <h4>${c.name}</h4>
        <span style="font-size:0.78rem;color:var(--muted)">${date}</span>
      </div>
      <div class="booking-card-body">
        <span><strong>Phone</strong>${c.phone}</span>
      </div>
      <p style="margin-top:1rem;color:var(--muted);font-size:0.88rem;line-height:1.7">${c.message}</p>
      <div class="booking-card-actions">
        <button class="btn-delete" onclick="deleteContact(${i})">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
}

function deleteContact(index) {
  const contacts = JSON.parse(localStorage.getItem('ofarin_contacts') || '[]');
  contacts.splice(index, 1);
  localStorage.setItem('ofarin_contacts', JSON.stringify(contacts));
  loadContacts();
}

function clearContacts() {
  if (confirm('Delete ALL messages?')) {
    localStorage.removeItem('ofarin_contacts');
    loadContacts();
  }
}

// ===== MEDIA =====
function handleMediaUpload(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  const media = JSON.parse(localStorage.getItem('ofarin_media') || '[]');
  let processed = 0;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const type = file.type.startsWith('video') ? 'video' : 'photo';
      media.push({ src: e.target.result, type, name: file.name, uploaded: new Date().toISOString() });
      processed++;
      if (processed === files.length) {
        localStorage.setItem('ofarin_media', JSON.stringify(media));
        loadAdminMedia();
      }
    };
    reader.readAsDataURL(file);
  });
}

function loadAdminMedia() {
  const grid = document.getElementById('adminMediaGrid');
  if (!grid) return;
  const media = JSON.parse(localStorage.getItem('ofarin_media') || '[]');

  if (media.length === 0) {
    grid.innerHTML = '<div class="empty-msg" style="grid-column:1/-1">No media uploaded yet.</div>';
    return;
  }

  grid.innerHTML = media.map((item, i) => {
    const content = item.type === 'photo'
      ? `<img src="${item.src}" alt="media ${i}"/>`
      : `<video src="${item.src}" muted></video>`;
    return `
    <div class="media-thumb">
      ${content}
      <button class="media-thumb-delete" onclick="deleteMedia(${i})">✕</button>
    </div>`;
  }).join('');
}

function deleteMedia(index) {
  const media = JSON.parse(localStorage.getItem('ofarin_media') || '[]');
  media.splice(index, 1);
  localStorage.setItem('ofarin_media', JSON.stringify(media));
  loadAdminMedia();
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const auth = localStorage.getItem('ofarin_admin_auth');
  if (auth === '1') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDash').style.display = 'block';
    loadBookings();
  }

  // Allow Enter key on password field
  const passEl = document.getElementById('adminPass');
  if (passEl) passEl.addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });
});
