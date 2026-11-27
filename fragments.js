(() => {
  const FRAGMENT_ATTR = 'data-fragment';
  const FRAGMENT_INDEX_ATTR = 'data-fragment-index';
  const ACTIVE_CLASS = 'fragment-active';
  const VISIBLE_CLASS = 'fragment-visible';
  const CURRENT_SLIDE_SELECTOR =
    'section[aria-hidden="false"], section.bespoke-marp-active, section:not([aria-hidden])';

  let fragments = [];
  let currentIndex = -1;
  let lastActiveSlide = null;
  let blackoutEl = null;
  let touchStartX = null;

  function getActiveSlide() {
    const explicit = document.querySelector('section[aria-hidden="false"], section.bespoke-marp-active');
    if (explicit) return explicit;
    return document.querySelector(CURRENT_SLIDE_SELECTOR);
  }

  function animateCountersInScope(scope) {
    if (!scope) return;
    const counters = scope.querySelectorAll('[data-count-to]');
    counters.forEach((el) => {
      if (el.dataset.counted === '1') return;
      const targetRaw = el.getAttribute('data-count-to');
      const target = parseFloat(targetRaw || '');
      if (!Number.isFinite(target)) return;

      el.dataset.counted = '1';
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const decimals = (targetRaw.split('.')[1] || '').length;
      const duration = Math.min(1200, Math.max(450, parseInt(el.getAttribute('data-duration') || '750', 10)));
      const start = performance.now();

      function tick(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
        }
      }

      requestAnimationFrame(tick);
    });
  }

  function replayMetersInScope(scope) {
    if (!scope) return;
    scope.querySelectorAll('.meter-fill').forEach((bar) => {
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    });
  }

  function scanFragments() {
    const slide = getActiveSlide();
    if (!slide) return;
    lastActiveSlide = slide;

    fragments = Array.from(slide.querySelectorAll(`[${FRAGMENT_ATTR}]`)).sort((a, b) => {
      const ai = parseInt(a.getAttribute(FRAGMENT_INDEX_ATTR) || a.getAttribute(FRAGMENT_ATTR) || '0', 10);
      const bi = parseInt(b.getAttribute(FRAGMENT_INDEX_ATTR) || b.getAttribute(FRAGMENT_ATTR) || '0', 10);
      return ai - bi;
    });

    fragments.forEach((el, i) => {
      el.setAttribute(FRAGMENT_INDEX_ATTR, String(i));
      el.classList.remove(ACTIVE_CLASS, VISIBLE_CLASS);
      el.querySelectorAll('[data-count-to]').forEach((c) => {
        delete c.dataset.counted;
      });
    });

    // Reset visible counters not inside hidden fragments
    slide.querySelectorAll('[data-count-to]').forEach((c) => {
      if (!c.closest(`[${FRAGMENT_ATTR}]`)) {
        delete c.dataset.counted;
      }
    });
    animateCountersInScope(slide);
    replayMetersInScope(slide);

    currentIndex = -1;
    updateSlideProgress();
  }

  function showFragment(targetIndex) {
    if (fragments.length === 0) return;

    targetIndex = Math.max(-1, Math.min(targetIndex, fragments.length - 1));

    if (targetIndex > currentIndex) {
      for (let i = currentIndex + 1; i <= targetIndex; i++) {
        const el = fragments[i];
        if (el) {
          requestAnimationFrame(() => {
            el.classList.add(ACTIVE_CLASS, VISIBLE_CLASS);
            animateCountersInScope(el);
            replayMetersInScope(el);
          });
        }
      }
    } else if (targetIndex < currentIndex) {
      for (let i = currentIndex; i > targetIndex; i--) {
        const el = fragments[i];
        if (el) {
          el.classList.remove(ACTIVE_CLASS, VISIBLE_CLASS);
          el.querySelectorAll('[data-count-to]').forEach((c) => {
            delete c.dataset.counted;
          });
        }
      }
    }

    currentIndex = targetIndex;
    updateSlideProgress();
  }

  function nextFragment() {
    if (currentIndex < fragments.length - 1) {
      showFragment(currentIndex + 1);
      return true;
    }
    return false;
  }

  function prevFragment() {
    if (currentIndex > -1) {
      showFragment(currentIndex - 1);
      return true;
    }
    return false;
  }

  function resetFragments() {
    showFragment(-1);
  }

  function replaySlideAnimations() {
    const slide = getActiveSlide();
    if (!slide) return;
    const animClasses = ['animate-in', 'animate-zoom', 'animate-left', 'animate-right', 'animate-blur', 'animate-pop'];
    const targets = [];
    animClasses.forEach((cls) => {
      if (slide.classList.contains(cls)) targets.push({ el: slide, cls });
    });
    if (targets.length > 0) {
      targets.forEach(({ el, cls }) => el.classList.remove(cls));
      void slide.offsetWidth;
      targets.forEach(({ el, cls }) => el.classList.add(cls));
    }
    slide.querySelectorAll('[data-count-to]').forEach((c) => {
      delete c.dataset.counted;
    });
    animateCountersInScope(slide);
    replayMetersInScope(slide);
    if (fragments.length > 0) {
      resetFragments();
    }
  }

  function toggleBlackout() {
    if (!blackoutEl) {
      blackoutEl = document.createElement('div');
      blackoutEl.setAttribute('aria-hidden', 'true');
      blackoutEl.style.cssText =
        'position:fixed;inset:0;background:#000;z-index:99999;opacity:0;pointer-events:none;transition:opacity 0.25s ease;';
      document.body.appendChild(blackoutEl);
    }
    const isHidden = blackoutEl.style.opacity === '0' || !blackoutEl.style.opacity;
    blackoutEl.style.opacity = isHidden ? '1' : '0';
    blackoutEl.style.pointerEvents = isHidden ? 'auto' : 'none';
  }

  function updateSlideProgress() {
    const slide = getActiveSlide();
    if (!slide) return;
    if (fragments.length > 0) {
      slide.setAttribute('data-fragment-progress', `${currentIndex + 1}/${fragments.length}`);
    } else {
      slide.removeAttribute('data-fragment-progress');
    }
  }

  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.target && (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'b' || e.key === 'B' || e.key === '.') {
        e.preventDefault();
        toggleBlackout();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        replaySlideAnimations();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        if (!nextFragment()) {
          dispatchBespokeNext();
        } else {
          e.preventDefault();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (!prevFragment()) {
          dispatchBespokePrev();
        } else {
          e.preventDefault();
        }
      } else if (e.key === 'Home') {
        resetFragments();
      } else if (e.key === 'End') {
        showFragment(fragments.length - 1);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target && e.target.closest && e.target.closest('[data-bespoke-marp-osc], a, button')) return;
      if (blackoutEl && blackoutEl.style.opacity === '1') {
        toggleBlackout();
        return;
      }
      if (nextFragment()) {
        e.stopPropagation();
      }
    }, true);

    document.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (touchStartX === null || !e.changedTouches || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 48) return;
      if (dx < 0) {
        if (!nextFragment()) dispatchBespokeNext();
      } else if (!prevFragment()) {
        dispatchBespokePrev();
      }
    }, { passive: true });
  }

  function dispatchBespokeNext() {
    document.dispatchEvent(new CustomEvent('bespoke:next'));
  }

  function dispatchBespokePrev() {
    document.dispatchEvent(new CustomEvent('bespoke:prev'));
  }

  function onSlideChange() {
    const active = getActiveSlide();
    if (active && active !== lastActiveSlide) {
      scanFragments();
    }
  }

  function observeBespokeSlides() {
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      onSlideChange();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-hidden', 'class'],
      subtree: true,
    });
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    scanFragments();
    bindKeys();
    observeBespokeSlides();
    document.addEventListener('bespoke:slidechange', onSlideChange);
    document.addEventListener('bespoke:activate', onSlideChange);

    if (window.Marp && window.Marp.Bespoke) {
      const originalNext = window.Marp.Bespoke.prototype.next;
      const originalPrev = window.Marp.Bespoke.prototype.prev;
      window.Marp.Bespoke.prototype.next = function (...args) {
        if (!nextFragment()) return originalNext.apply(this, args);
        return true;
      };
      window.Marp.Bespoke.prototype.prev = function (...args) {
        if (!prevFragment()) return originalPrev.apply(this, args);
        return true;
      };
    }
  }

  init();
})();