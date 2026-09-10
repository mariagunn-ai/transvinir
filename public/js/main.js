(function () {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('siteNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.content-page__body a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    const external = /^https?:\/\//i.test(href) || href.startsWith('/uploads/');
    if (external) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });

  document.querySelectorAll('[data-polaroid-slideshow]').forEach((container) => {
    const slides = container.querySelectorAll('.polaroid-slide');
    if (slides.length < 2) return;
    const interval = parseInt(container.getAttribute('data-interval'), 10) || 10000;
    let idx = 0;
    setInterval(() => {
      slides[idx].classList.remove('is-active');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('is-active');
    }, interval);
  });

  document.querySelectorAll('[data-lang-tabs]').forEach((group) => {
    const tabs = group.querySelectorAll('.lang-tabs__tab');
    const panes = group.querySelectorAll('.lang-pane');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const target = tab.getAttribute('data-target');
        tabs.forEach(t => t.classList.toggle('is-active', t === tab));
        panes.forEach(p => p.classList.toggle('is-active', p.getAttribute('data-pane') === target));
      });
    });
  });
})();
