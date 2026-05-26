(function () {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('siteNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

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
