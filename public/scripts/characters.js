document.addEventListener('DOMContentLoaded', () => {
  const row = document.querySelector('.cards-row');
  const btnPrev = document.querySelector('[data-cards-prev]');
  const btnNext = document.querySelector('[data-cards-next]');
  if (!row || !btnPrev || !btnNext) return;

  const updateButtons = () => {
    const maxScroll = row.scrollWidth - row.clientWidth;
    btnPrev.disabled = row.scrollLeft <= 0;
    btnNext.disabled = row.scrollLeft >= Math.max(0, maxScroll - 1);
  };

  const scrollByCard = (direction = 1) => {
    const card = row.querySelector('.character-card');
    if (!card) return;
    const style = getComputedStyle(row);
    const gap = parseInt(style.gap || 18, 10) || 18;
    const cardWidth = card.getBoundingClientRect().width + gap;
    row.scrollBy({ left: cardWidth * direction, behavior: 'smooth' });
  };

  btnPrev.addEventListener('click', () => { scrollByCard(-1); });
  btnNext.addEventListener('click', () => { scrollByCard(1); });

  row.addEventListener('scroll', () => { updateButtons(); });
  window.addEventListener('resize', () => { updateButtons(); });

  // keyboard navigation when focus is inside the row
  row.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCard(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByCard(-1); }
  });

  // initialize
  updateButtons();
  
  // --- Modal: character detail ---
  const modal = document.querySelector('[data-character-modal]');
  const modalOverlay = modal && modal.querySelector('[data-modal-overlay]');
  const modalClose = modal && modal.querySelector('[data-modal-close]');
  const modalImage = modal && modal.querySelector('[data-modal-image]');
  const modalTitle = modal && modal.querySelector('[data-modal-title]');
  const modalDesc = modal && modal.querySelector('[data-modal-desc]');
  let lastFocused = null;
  
  const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  
  function openModalFromCard(card) {
    if (!modal || !card) return;
    const img = card.querySelector('img');
    const title = card.querySelector('h3');
    const desc = card.querySelector('p');
    if (modalImage) { modalImage.src = img ? img.src : ''; modalImage.alt = img ? img.alt || title?.textContent || '' : ''; }
    if (modalTitle) modalTitle.textContent = title ? title.textContent : '';
    if (modalDesc) modalDesc.textContent = desc ? desc.textContent : '';
    lastFocused = document.activeElement;
    modal.removeAttribute('aria-hidden');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // focus the close button
    if (modalClose) modalClose.focus();
  }
  
  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
  
  // Attach handlers to cards
  const cards = Array.from(document.querySelectorAll('.character-card'));
  cards.forEach((card) => {
    card.addEventListener('click', () => openModalFromCard(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModalFromCard(card); }
    });
  });
  
  // Modal close handlers
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hasAttribute('aria-hidden')) closeModal();
  });
  
  // Simple focus trap when modal is open
  document.addEventListener('focusin', (e) => {
    if (!modal || modal.hasAttribute('aria-hidden')) return;
    const focusable = modal.querySelectorAll(focusableSelector);
    if (focusable.length === 0) return;
    if (!modal.contains(e.target)) {
      // redirect focus to first focusable inside modal
      focusable[0].focus();
    }
  });

});
