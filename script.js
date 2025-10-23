// ===== Precise smooth-scroll for in-page links (nav + bookmarks) =====
(function(){
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => [...r.querySelectorAll(s)];

  function anchorOffset(){
    const header = qs('.site-header');
    const tear   = qs('.tear');
    const perfs  = qs('.perfs');
    // Add a little breathing room
    return (header?.offsetHeight || 0) +
           (tear?.offsetHeight || 0) +
           (perfs?.offsetHeight || 0) + 12;
  }

  function smoothScrollTo(el){
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top - anchorOffset();
    window.scrollTo({ top, behavior: 'smooth' });

    // Move focus for a11y once we’re “close enough”
    const target = el;
    target.setAttribute('tabindex', '-1'); // make focusable if not already
    const check = () => {
      const delta = Math.abs((window.scrollY + anchorOffset()) - (target.offsetTop));
      if (delta < 4) target.focus({ preventScroll: true });
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  // Intercept clicks on in-page links in header nav + bookmarks
  const containers = [qs('.top-nav'), qs('.bookmarks'), qs('.content')].filter(Boolean);
  containers.forEach(root => {
    root.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const target = qs(id ? `#${CSS.escape(id)}` : null);
      if (!target) return;
      e.preventDefault();
      smoothScrollTo(target);
      // Update URL without the default jump
      history.pushState(null, '', `#${id}`);
    });
  });

  // If visiting with a hash, fix initial position too
  window.addEventListener('load', () => {
    if (location.hash) {
      const target = qs(location.hash);
      if (target) setTimeout(() => smoothScrollTo(target), 0);
    }
  });

  // Recompute offset on resize
  window.addEventListener('resize', () => {
    // No action needed — we compute live each time — but this
    // keeps the function from getting tree-shaken if you bundle.
    anchorOffset();
  });
})();

// ===== Click a project card to open details in a modal =====
(() => {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  const titleEl = modal.querySelector('#pm-title');
  const tagEl   = modal.querySelector('.pm-tag');
  const content = modal.querySelector('.pm-content');
  const closeBtn= modal.querySelector('.pm-close');
  const header  = document.querySelector('.site-header');
  const main    = document.querySelector('main');

  // helper: lock/unlock background scroll + focus
  function lockPage(lock){
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    // politely reduce background focusability if supported
    header?.toggleAttribute('inert', lock);
    main?.toggleAttribute('inert', lock);
  }

  function openFromSeed(seed){
    // Build content from the card
    const h3  = seed.querySelector('h3')?.textContent?.trim() || 'Project';
    const tag = seed.querySelector('.seed__tag')?.textContent?.trim() || '';
    const tpl = seed.querySelector('template.seed-detail');

    titleEl.textContent = h3;
    tagEl.textContent = tag;
    content.innerHTML = ''; // clear
    if (tpl) content.appendChild(tpl.content.cloneNode(true));
    else content.innerHTML = '<p>More details coming soon.</p>';

    // Open the modal
    try { modal.showModal(); } catch { modal.setAttribute('open',''); } // robust fallback
    lockPage(true);

    // focus the close button for keyboard users
    closeBtn?.focus();
  }

  function closeModal(){
    if (modal.open) modal.close();
    modal.removeAttribute('open');
    lockPage(false);
  }

  // Close interactions
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('close', () => lockPage(false));
  modal.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); }); // Esc
  // Click backdrop to close
  modal.addEventListener('click', (e) => {
    const rect = modal.getBoundingClientRect();
    const clickedInContent =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom;
    if (!clickedInContent) closeModal();
  });

  // Open when clicking a card (but ignore clicks on actual links)
  document.querySelectorAll('.seed').forEach(seed => {
    seed.setAttribute('tabindex','0');     // focusable
    seed.setAttribute('role','button');    // announces as a control

    seed.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;   // let links do their thing
      openFromSeed(seed);
    });

    seed.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFromSeed(seed);
      }
    });
  });
})();
