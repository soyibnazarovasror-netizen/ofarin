// ===========================
// OFARIN — booking.js
// Sends to backend server
// ===========================

// ⚠️ Bu yerga Render.com dagi server URL ni yozing
const SERVER_URL = 'https://ofarin-backend-1.onrender.com';

let currentYear, currentMonth, selectedDate = null, selectedSlot = null;

const MONTHS = {
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  uz: ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'],
  ru: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
};

async function fetchBookings() {
  try {
    const res = await fetch(`${SERVER_URL}/api/bookings`);
    return await res.json();
  } catch(e) {
    // Agar server ishlamasa localStorage dan o'qi
    return JSON.parse(localStorage.getItem('ofarin_bookings') || '[]');
  }
}

function getSlotStatus(dateStr, bookings) {
  const day = bookings.filter(b => b.date === dateStr && b.status !== 'rejected');
  const morning = day.some(b => b.slot === 'morning');
  const evening = day.some(b => b.slot === 'evening');
  if (morning && evening) return 'full';
  if (morning || evening) return 'half';
  return 'free';
}

function getTakenSlots(dateStr, bookings) {
  return bookings
    .filter(b => b.date === dateStr && b.status !== 'rejected')
    .map(b => b.slot);
}

let cachedBookings = [];

async function renderCalendar() {
  cachedBookings = await fetchBookings();

  const lang = localStorage.getItem('ofarin_lang') || 'uz';
  const grid = document.getElementById('calGrid');
  const monthLabel = document.getElementById('calMonthYear');
  if (!grid || !monthLabel) return;

  const months = MONTHS[lang] || MONTHS['en'];
  monthLabel.textContent = months[currentMonth] + ' ' + currentYear;

  grid.innerHTML = '';
  const today = new Date();
  today.setHours(0,0,0,0);

  let startDow = new Date(currentYear, currentMonth, 1).getDay();
  startDow = (startDow === 0) ? 6 : startDow - 1;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < startDow; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    const dateObj = new Date(currentYear, currentMonth, d);
    const dateStr = formatDate(currentYear, currentMonth + 1, d);
    const status = getSlotStatus(dateStr, cachedBookings);
    const isPast  = dateObj < today;
    const isToday = dateObj.getTime() === today.getTime();
    const isSel   = selectedDate === dateStr;

    let cls = 'cal-day';
    if (isPast)       cls += ' past';
    else if (status === 'full') cls += ' full';
    else if (status === 'half') cls += ' half';
    if (isToday) cls += ' today';
    if (isSel)   cls += ' selected';

    cell.className = cls;
    cell.textContent = d;

    if (!isPast && status !== 'full') {
      cell.onclick = () => selectDate(dateStr, cell);
    }
    grid.appendChild(cell);
  }
}

function formatDate(y, m, d) {
  return y + '-' + String(m).padStart(2,'0') + '-' + String(d).padStart(2,'0');
}

function selectDate(dateStr, cell) {
  selectedDate = dateStr;
  selectedSlot = null;
  document.querySelectorAll('.cal-day.selected').forEach(c => c.classList.remove('selected'));
  cell.classList.add('selected');

  const display = document.getElementById('selectedDateDisplay');
  const lang = localStorage.getItem('ofarin_lang') || 'uz';
  const labels = { en: 'Selected date:', uz: 'Tanlangan sana:', ru: 'Выбранная дата:' };
  if (display) {
    display.style.display = 'block';
    display.textContent = (labels[lang] || labels.en) + ' ' + dateStr;
  }

  const taken = getTakenSlots(dateStr, cachedBookings);
  const mBtn = document.getElementById('slot-morning');
  const eBtn = document.getElementById('slot-evening');
  if (mBtn) { mBtn.classList.remove('active','disabled'); if (taken.includes('morning')) mBtn.classList.add('disabled'); }
  if (eBtn) { eBtn.classList.remove('active','disabled'); if (taken.includes('evening')) eBtn.classList.add('disabled'); }
}

function selectSlot(slot) {
  selectedSlot = slot;
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('slot-' + slot);
  if (btn) btn.classList.add('active');
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
}
function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

async function submitBooking() {
  const lang = localStorage.getItem('ofarin_lang') || 'uz';
  const t = translations[lang] || translations['en'];
  const msgEl = document.getElementById('formMsg');
  const submitBtn = document.querySelector('.booking-form-wrap .btn-primary');

  const name   = document.getElementById('f_name').value.trim();
  const phone  = document.getElementById('f_phone').value.trim();
  const event  = document.getElementById('f_event').value;
  const guests = document.getElementById('f_guests').value.trim();
  const note   = document.getElementById('f_note').value.trim();

  if (!selectedDate) { showMsg(msgEl, t.form_err_date,   'error'); return; }
  if (!selectedSlot) { showMsg(msgEl, t.form_err_slot,   'error'); return; }
  if (!name || !phone || !event) { showMsg(msgEl, t.form_err_fields, 'error'); return; }

  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳...'; }

  try {
    const res = await fetch(`${SERVER_URL}/api/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, event, slot: selectedSlot, date: selectedDate, guests, note })
    });

    const data = await res.json();

    if (!res.ok) {
      showMsg(msgEl, data.error || t.form_err_fields, 'error');
    } else {
      showMsg(msgEl, t.form_success, 'success');
      // Reset
      ['f_name','f_phone','f_guests','f_note'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      document.getElementById('f_event').value = '';
      selectedDate = null; selectedSlot = null;
      const disp = document.getElementById('selectedDateDisplay');
      if (disp) disp.style.display = 'none';
      document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
      renderCalendar();
    }
  } catch(e) {
    showMsg(msgEl, 'Server bilan bog\'lanishda xatolik. Qayta urinib ko\'ring.', 'error');
  }

  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = t.form_submit; }
}

function showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = 'form-msg ' + type;
  el.style.display = 'block';
  setTimeout(() => { if (type === 'success') el.style.display = 'none'; }, 7000);
}

document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  renderCalendar();
});

const _origSetLang = window.setLang;
window.setLang = function(lang) {
  if (_origSetLang) _origSetLang(lang);
  renderCalendar();
};
