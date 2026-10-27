(() => {
  const $ = (id) => document.getElementById(id);
  const builder = $('builder');
  const recipientView = $('recipientView');
  const form = $('letterForm');
  const overlay = $('letterOverlay');
  const fullLetter = $('fullLetter');
  const recipientEnvelope = $('recipientEnvelope');
  const previewEnvelope = $('envelope');
  const closeButton = $('closeLetter');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let opening = false;
  let opened = false;
  let activeEnvelope = null;
  let originRect = null;
  let activeAnimation = null;

  const fields = {
    recipient: $('recipient'),
    title: $('title'),
    message: $('message'),
    signature: $('signature'),
    theme: $('theme')
  };

  function getData() {
    return {
      recipient: fields.recipient?.value.trim() || '',
      title: fields.title?.value.trim() || 'Несколько важных слов',
      message: fields.message?.value.trim() || '',
      signature: fields.signature?.value.trim() || '',
      theme: fields.theme?.value || 'rose'
    };
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value || '';
  }

  function paintPreview(data) {
    setText('previewTitle', data.title);
    setText('peekTitle', data.title);
    setText('peekCopy', data.message);
    const preview = document.querySelector('.preview-paper');
    if (preview) preview.dataset.theme = data.theme;
    document.documentElement.dataset.theme = data.theme;
    const themeMap = {
      rose: ['#e7789e','#ce5a83','#ec8cac','#ffc1d4'],
      blush: ['#ed9bb4','#dc7e9d','#f0a6bc','#ffd5e0'],
      berry: ['#bf527a','#96345c','#d87596','#f1b1c8']
    };
    const [rose, dark, mid, light] = themeMap[data.theme] || themeMap.rose;
    preview?.style.setProperty('--rose', rose);
    preview?.style.setProperty('--rose-dark', dark);
    preview?.style.setProperty('--rose-mid', mid);
    preview?.style.setProperty('--rose-light', light);
  }

  function fillLetter(data) {
    setText('fullTitle', data.title);
    setText('toLine', data.recipient ? `Для ${data.recipient}` : '');
    setText('fullMessage', data.message);
    setText('fullSignature', data.signature);
    setText('recipientCaption', data.recipient ? `${data.recipient}, для тебя есть письмо` : 'Кто-то приготовил для тебя несколько слов');
    setText('recipientPeekTitle', data.title);
    setText('recipientPeekCopy', data.message);
    recipientView.classList.remove('theme-rose', 'theme-blush', 'theme-berry');
    recipientView.classList.add(`theme-${data.theme}`);
    recipientView.style.setProperty('--rose', ({rose:'#e7789e',blush:'#ed9bb4',berry:'#bf527a'})[data.theme] || '#e7789e');
    recipientView.style.setProperty('--rose-dark', ({rose:'#ce5a83',blush:'#dc7e9d',berry:'#96345c'})[data.theme] || '#ce5a83');
    recipientView.style.setProperty('--rose-mid', ({rose:'#ec8cac',blush:'#f0a6bc',berry:'#d87596'})[data.theme] || '#ec8cac');
    recipientView.style.setProperty('--rose-light', ({rose:'#ffc1d4',blush:'#ffd5e0',berry:'#f1b1c8'})[data.theme] || '#ffc1d4');
  }

  function encodeData(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  function decodeData(encoded) {
    try {
      const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (typeof data.message !== 'string' || typeof data.title !== 'string') return null;
      return {
        recipient: String(data.recipient || '').slice(0,80),
        title: String(data.title || 'Несколько важных слов').slice(0,100),
        message: String(data.message || '').slice(0,5000),
        signature: String(data.signature || '').slice(0,100),
        theme: ['rose','blush','berry'].includes(data.theme) ? data.theme : 'rose'
      };
    } catch (_) { return null; }
  }

  function getTargetRect() {
    const pad = window.innerWidth <= 520 ? 14 : Math.min(48, Math.max(22, window.innerWidth * .04));
    const maxWidth = Math.min(760, window.innerWidth - pad * 2);
    const maxHeight = Math.min(window.innerHeight * .86, 980);
    return {
      left: (window.innerWidth - maxWidth) / 2,
      top: (window.innerHeight - maxHeight) / 2,
      width: maxWidth,
      height: maxHeight
    };
  }

  function setFlightGeometry(rect) {
    Object.assign(fullLetter.style, {
      position: 'fixed',
      margin: '0',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      maxHeight: 'none',
      zIndex: '22'
    });
  }

  function clearFlightGeometry() {
    ['position','margin','left','top','width','height','maxHeight','zIndex','opacity','transform','overflow'].forEach(k => fullLetter.style.removeProperty(k));
  }

  async function openLetter(envelope) {
    if (opening || opened) return;
    opening = true;
    activeEnvelope = envelope;
    const recipientMode = envelope === recipientEnvelope;
    const peek = envelope.querySelector('.letter-peek');
    if (!peek) { opening = false; return; }

    // Phase 1: the flap opens and the sheet physically rises out of the envelope.
    envelope.classList.add('is-opening');
    if (recipientMode) recipientView.classList.add('is-opening');
    else document.querySelector('.preview-paper')?.classList.add('is-opening');

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, reduceMotion ? 0 : ms));
    await wait(420);

    // The flying sheet starts exactly where the visible paper is, not at a guessed coordinate.
    originRect = peek.getBoundingClientRect();
    const start = {
      left: originRect.left,
      top: originRect.top,
      width: Math.max(originRect.width, 1),
      height: Math.max(originRect.height, 1)
    };
    const target = getTargetRect();
    fillLetter(getDataFromCurrentView());
    setFlightGeometry(start);
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
    closeButton.hidden = false;

    // Force the browser to commit the starting geometry before animating.
    fullLetter.getBoundingClientRect();
    const duration = reduceMotion ? 1 : 1050;
    activeAnimation = fullLetter.animate([
      {
        left: `${start.left}px`, top: `${start.top}px`,
        width: `${start.width}px`, height: `${start.height}px`,
        borderRadius: '1px', opacity: .96,
        transform: 'scale(.98)',
        boxShadow: '0 4px 16px rgba(104,43,67,.08)'
      },
      {
        left: `${target.left}px`, top: `${target.top + 10}px`,
        width: `${target.width}px`, height: `${target.height}px`,
        borderRadius: '2px', opacity: 1,
        transform: 'scale(1.008)',
        boxShadow: '0 24px 90px rgba(104,43,67,.15)',
        offset: .78
      },
      {
        left: `${target.left}px`, top: `${target.top}px`,
        width: `${target.width}px`, height: `${target.height}px`,
        borderRadius: '2px', opacity: 1,
        transform: 'scale(1)',
        boxShadow: '0 24px 90px rgba(104,43,67,.15)'
      }
    ], { duration, easing: 'cubic-bezier(.18,.76,.22,1)', fill: 'forwards' });

    try { await activeAnimation.finished; } catch (_) {}
    activeAnimation = null;
    setFlightGeometry(target);
    fullLetter.style.opacity = '1';
    fullLetter.style.transform = 'none';
    fullLetter.style.overflow = 'auto';
    opened = true;
    opening = false;
    if (recipientMode) $('recipientHint').textContent = 'ПИСЬМО ОТКРЫТО';
    fullLetter.focus?.({ preventScroll: true });
  }

  function getDataFromCurrentView() {
    if (!recipientView.hidden) return window.letterData || getData();
    return getData();
  }

  async function closeLetterView() {
    if (!opened || opening || !activeEnvelope) return;
    opening = true;
    const peek = activeEnvelope.querySelector('.letter-peek');
    const current = fullLetter.getBoundingClientRect();
    // Temporarily let the envelope peek return to its starting position to measure it.
    activeEnvelope.classList.remove('is-opening');
    recipientView.classList.remove('is-opening');
    document.querySelector('.preview-paper')?.classList.remove('is-opening');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const destRect = peek.getBoundingClientRect();
    // Re-apply the open state while the paper flies back, then close the flap at the end.
    activeEnvelope.classList.add('is-opening');
    if (!recipientView.hidden) recipientView.classList.add('is-opening');
    else document.querySelector('.preview-paper')?.classList.add('is-opening');

    if (activeAnimation) activeAnimation.cancel();
    const duration = reduceMotion ? 1 : 760;
    activeAnimation = fullLetter.animate([
      {
        left: `${current.left}px`, top: `${current.top}px`,
        width: `${current.width}px`, height: `${current.height}px`,
        opacity: 1, transform: 'scale(1)', borderRadius: '2px'
      },
      {
        left: `${destRect.left}px`, top: `${destRect.top - 18}px`,
        width: `${destRect.width}px`, height: `${destRect.height}px`,
        opacity: .94, transform: 'scale(.97)', borderRadius: '1px'
      },
      {
        left: `${destRect.left}px`, top: `${destRect.top}px`,
        width: `${destRect.width}px`, height: `${destRect.height}px`,
        opacity: 0, transform: 'scale(.94)', borderRadius: '1px'
      }
    ], { duration, easing: 'cubic-bezier(.65,0,.8,.25)', fill: 'forwards' });
    try { await activeAnimation.finished; } catch (_) {}
    activeAnimation = null;
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    closeButton.hidden = true;
    clearFlightGeometry();
    fullLetter.style.overflow = '';
    activeEnvelope.classList.remove('is-opening');
    recipientView.classList.remove('is-opening');
    document.querySelector('.preview-paper')?.classList.remove('is-opening');
    if (!recipientView.hidden) $('recipientHint').textContent = 'НАЖМИ, ЧТОБЫ ОТКРЫТЬ';
    opened = false;
    opening = false;
    activeEnvelope = null;
  }

  // Preview editor interactions
  function updatePreview() { paintPreview(getData()); }
  ['recipient','title','message','signature','theme'].forEach(id => {
    $(id)?.addEventListener('input', updatePreview);
    $(id)?.addEventListener('change', updatePreview);
  });
  $('refresh')?.addEventListener('click', updatePreview);
  previewEnvelope?.addEventListener('click', () => openLetter(previewEnvelope));
  recipientEnvelope?.addEventListener('click', () => openLetter(recipientEnvelope));
  closeButton?.addEventListener('click', closeLetterView);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && opened) closeLetterView();
  });
  window.addEventListener('resize', () => {
    if (opened && !opening) {
      const target = getTargetRect();
      setFlightGeometry(target);
    }
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = getData();
    if (!data.message) {
      fields.message.focus();
      return;
    }
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('letter', encodeData(data));
    $('shareUrl').value = url.toString();
    $('shareResult').hidden = false;
    $('copyLink').textContent = 'Копировать';
  });
  $('copyLink')?.addEventListener('click', async () => {
    const value = $('shareUrl').value;
    try {
      await navigator.clipboard.writeText(value);
      $('copyLink').textContent = 'Скопировано ✓';
    } catch (_) {
      $('shareUrl').focus();
      $('shareUrl').select();
      document.execCommand('copy');
      $('copyLink').textContent = 'Скопировано ✓';
    }
  });

  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('letter');
  const shared = encoded ? decodeData(encoded) : null;
  if (shared) {
    window.letterData = shared;
    builder.hidden = true;
    recipientView.hidden = false;
    fillLetter(shared);
    document.title = shared.recipient ? `Письмо для ${shared.recipient}` : 'Письмо для тебя';
  } else {
    paintPreview(getData());
  }
})();