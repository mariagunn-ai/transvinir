(function () {
  document.querySelectorAll('input[data-file-helper-input]').forEach((input) => {
    const wrap = input.closest('.file-helper') || document;
    const urlField = wrap.querySelector('[data-file-helper-url]');
    const status = wrap.querySelector('[data-file-helper-status]');
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (status) status.textContent = 'Hleður upp …';
      if (urlField) urlField.value = '';
      const formData = new FormData();
      formData.append('file', file);
      fetch('/admin/upload', { method: 'POST', body: formData })
        .then((res) => res.ok ? res.json() : Promise.reject(new Error('Upphleðsla mistókst')))
        .then((data) => {
          if (data && data.url) {
            if (urlField) {
              urlField.value = data.url;
              urlField.select();
            }
            if (status) status.textContent = 'Tilbúið. Slóðin er afrituð sjálfkrafa ef þú smellir á reitinn.';
          } else {
            if (status) status.textContent = 'Villa: engin slóð skilaði sér.';
          }
        })
        .catch((err) => {
          if (status) status.textContent = 'Villa: ' + (err.message || 'óþekkt');
        });
    });
  });

  if (typeof EasyMDE === 'undefined') return;

  const textareas = document.querySelectorAll('textarea[data-markdown-editor]');
  if (!textareas.length) return;

  const editors = [];

  const alignAction = (align) => (editor) => {
    const cm = editor.codemirror;
    const selection = cm.getSelection();
    const inner = selection || 'Skrifaðu hér';
    const block = `<div style="text-align:${align}">\n\n${inner}\n\n</div>\n`;
    cm.replaceSelection(block);
    cm.focus();
  };

  textareas.forEach((textarea) => {
    const editor = new EasyMDE({
      element: textarea,
      spellChecker: false,
      autoDownloadFontAwesome: true,
      status: ['lines', 'words'],
      uploadImage: true,
      imageUploadFunction: (file, onSuccess, onError) => {
        const formData = new FormData();
        formData.append('file', file);
        fetch('/admin/upload', { method: 'POST', body: formData })
          .then((res) => res.ok ? res.json() : Promise.reject(new Error('Upload mistókst')))
          .then((data) => {
            if (data && data.url) onSuccess(data.url);
            else onError('Engin slóð skilaði sér frá þjóni.');
          })
          .catch((err) => onError(err.message || 'Mistókst að hlaða upp mynd.'));
      },
      toolbar: [
        'bold', 'italic', 'heading', '|',
        {
          name: 'align-left',
          action: alignAction('left'),
          className: 'fa fa-align-left',
          title: 'Vinstri'
        },
        {
          name: 'align-center',
          action: alignAction('center'),
          className: 'fa fa-align-center',
          title: 'Miðja'
        },
        {
          name: 'align-right',
          action: alignAction('right'),
          className: 'fa fa-align-right',
          title: 'Hægri'
        },
        '|',
        'quote', 'unordered-list', 'ordered-list', '|',
        'link', 'image', 'table', '|',
        'preview', 'side-by-side', 'fullscreen', '|',
        'guide'
      ]
    });
    editors.push(editor);
  });

  document.querySelectorAll('[data-lang-tabs]').forEach((group) => {
    group.querySelectorAll('.lang-tabs__tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        setTimeout(() => editors.forEach((ed) => ed.codemirror.refresh()), 0);
      });
    });
  });

  const forms = new Set();
  textareas.forEach((t) => { if (t.form) forms.add(t.form); });
  forms.forEach((form) => {
    form.addEventListener('submit', () => {
      editors.forEach((ed) => {
        if (ed.element && ed.element.form === form) {
          ed.element.value = ed.value();
        }
      });
    });
  });
})();
