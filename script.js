(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const selInPage = '.top-nav, .bookmarks, .content';

  const anchorOffset = () =>
    ($('.site-header')?.offsetHeight || 0) +
    ($('.tear')?.offsetHeight || 0) +
    ($('.perfs')?.offsetHeight || 0) + 12;

  const smoothScrollTo = (el) => {
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top - anchorOffset();
    window.scrollTo({ top, behavior: 'smooth' });
    // scroll stuff per movement to each section
    setTimeout(() => {
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }, 250);
  };

  // movement to each page using links 
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !a.closest(selInPage)) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && $(`#${CSS.escape(id)}`);
    if (!target) return;
    e.preventDefault();
    smoothScrollTo(target);
    history.pushState(null, '', `#${id}`);
  }, { passive:false });

  window.addEventListener('load', () => {
    if (location.hash) smoothScrollTo($(location.hash));
  });


  const modal = $('#project-modal');
  if (modal) {
    const title = $('#pm-title', modal);
    const tag   = $('.pm-tag', modal);
    const body  = $('.pm-content', modal);
    const close = $('.pm-close', modal);
    const header= $('.site-header');
    const main  = $('main');

    const lock = (on) => {
      document.documentElement.style.overflow = on ? 'hidden' : '';
      header?.toggleAttribute('inert', on);
      main?.toggleAttribute('inert', on);
    };

    const openFromSeed = (seed) => {
      title.textContent = seed.querySelector('h3')?.textContent?.trim() || 'Project';
      tag.textContent   = seed.querySelector('.seed__tag')?.textContent?.trim() || '';
      body.innerHTML    = '';
      const tpl = seed.querySelector('template.seed-detail');
      body.appendChild((tpl?.content || document.createRange().createContextualFragment('<p>More details coming soon.</p>')).cloneNode(true));
      try { modal.showModal(); } catch { modal.setAttribute('open',''); }
      lock(true); close?.focus();
    };

    document.addEventListener('click', (e) => {
      const seed = e.target.closest('.seed');
      if (!seed || e.target.closest('a')) return;
      openFromSeed(seed);
    });
    document.addEventListener('keydown', (e) => {
      if ((e.key !== 'Enter' && e.key !== ' ') || !e.target.closest('.seed')) return;
      e.preventDefault(); openFromSeed(e.target.closest('.seed'));
    });

    const closeModal = () => { if (modal.open) modal.close(); modal.removeAttribute('open'); lock(false); };
    close?.addEventListener('click', closeModal);
    modal.addEventListener('close', closeModal);
    modal.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); }); // Esc
    modal.addEventListener('click', (e) => {
      const r = modal.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal();
    });
  }

  const links = $$('.top-nav a[href^="#"]');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if (sections.length) {
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!vis) return;
      const id = `#${vis.target.id}`;
      links.forEach(l => l.setAttribute('aria-current', l.getAttribute('href') === id ? 'true' : 'false'));
    }, { rootMargin: `-${Math.max(0, anchorOffset() - 10)}px 0px -50% 0px`, threshold: [0.25, 0.5, 0.75] });
    sections.forEach(s => io.observe(s));
    window.addEventListener('resize', () => {
      // Reattach observer with new margin (cheap enough for few sections)
      io.disconnect();
      sections.forEach(s => io.observe(s));
    });
  }
})();

