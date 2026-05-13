// ===========================
// OFARIN — gallery.js
// ===========================

let currentFilter = 'all';

function getMedia() {
  return JSON.parse(localStorage.getItem('ofarin_media') || '[]');
}

function renderGallery(filter) {
  currentFilter = filter || 'all';
  const grid = document.getElementById('galleryGrid');
  const empty = document.getElementById('galleryEmpty');
  if (!grid) return;

  const media = getMedia();
  const filtered = currentFilter === 'all' ? media : media.filter(m => m.type === currentFilter);

  grid.innerHTML = '';

  if (filtered.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  filtered.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'gallery-item';

    if (item.type === 'photo') {
      div.innerHTML = `
        <img src="${item.src}" alt="Ofarin Media ${idx + 1}" loading="lazy"/>
        <div class="media-overlay">🔍</div>
      `;
      div.onclick = () => openLightbox(item.src);
    } else {
      div.innerHTML = `
        <video src="${item.src}" muted playsinline preload="metadata"></video>
        <div class="media-overlay">▶</div>
      `;
      div.onclick = () => openLightbox(null, item.src);
    }
    grid.appendChild(div);
  });
}

function filterGallery(type) {
  currentFilter = type;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderGallery(type);
}

function openLightbox(imgSrc, videoSrc) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  if (!lb) return;

  if (imgSrc) {
    img.src = imgSrc;
    img.style.display = 'block';
  }
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  if (lb) lb.classList.remove('open');
  if (img) img.src = '';
  document.body.style.overflow = '';
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

document.addEventListener('DOMContentLoaded', () => {
  renderGallery('all');
});