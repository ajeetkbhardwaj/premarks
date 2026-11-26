(() => {
  const FRAGMENT_ATTR = 'data-fragment';
  const FRAGMENT_INDEX_ATTR = 'data-fragment-index';
  const ACTIVE_CLASS = 'fragment-active';
  const VISIBLE_CLASS = 'fragment-visible';
  const CURRENT_SLIDE_SELECTOR = 'section[aria-hidden="false"], section:not([aria-hidden])';

  let fragments = [];
  let currentIndex = -1;
  let isEnabled = true;

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    scanFragments();
    bindKeys();
    showFragment(0);
  }

  function scanFragments() {
    const slide = document.querySelector(CURRENT_SLIDE_SELECTOR);
    if (!slide) return;

    fragments = Array.from(slide.querySelectorAll(`[${FRAGMENT_ATTR}]`))
      .sort((a, b) => {
        const ai = parseInt(a.getAttribute(FRAGMENT_INDEX_ATTR) || '0', 10);
        const bi = parseInt(b.getAttribute(FRAGMENT_INDEX_ATTR) || '0', 10);
        return ai - bi;
      });

    fragments.forEach((el, i) => {
      el.setAttribute(FRAGMENT_INDEX_ATTR, i);
      el.classList.remove(ACTIVE_CLASS, VISIBLE_CLASS);
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.transition = 'opacity 0.35s cubic-bezier(0.2,0.6,0.2,1), transform 0.35s cubic-bezier(0.2,0.6,0.2,1)';
    });

    currentIndex = -1;
  }

  function showFragment(targetIndex) {
    if (!isEnabled || fragments.length === 0) return;

    targetIndex = Math.max(-1, Math.min(targetIndex, fragments.length - 1));

    if (targetIndex > currentIndex) {
      for (let i = currentIndex + 1; i <= targetIndex; i++) {
        const el = fragments[i];
        if (el) {
          requestAnimationFrame(() => {
            el.classList.add(ACTIVE_CLASS, VISIBLE_CLASS);
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
        }
      }
    } else if (targetIndex < currentIndex) {
      for (let i = currentIndex; i > targetIndex; i--) {
        const el = fragments[i];
        if (el) {
          el.classList.remove(ACTIVE_CLASS, VISIBLE_CLASS);
          el.style.opacity = '0';
          el.style.transform = 'translateY(-8px)';
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

  function updateSlideProgress() {
    const slide = document.querySelector(CURRENT_SLIDE_SELECTOR);
    if (!slide) return;
    slide.setAttribute('data-fragment-progress', `${currentIndex + 1}/${fragments.length}`);
  }

  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        if (!nextFragment()) {
          dispatchBespokeNext();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (!prevFragment()) {
          dispatchBespokePrev();
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        resetFragments();
      } else if (e.key === 'End') {
        e.preventDefault();
        showFragment(fragments.length - 1);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-bespoke-marp-osc]')) return;
      if (!nextFragment()) {
        dispatchBespokeNext();
      }
    });
  }

  function dispatchBespokeNext() {
    const event = new CustomEvent('bespoke:next');
    document.dispatchEvent(event);
  }

  function dispatchBespokePrev() {
    const event = new CustomEvent('bespoke:prev');
    document.dispatchEvent(event);
  }

  function onSlideChange() {
    scanFragments();
    showFragment(-1);
  }

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

  init();
})();