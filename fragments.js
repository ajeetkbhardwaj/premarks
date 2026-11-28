(() => {
  const FRAGMENT_ATTR = 'data-fragment';
  const FRAGMENT_INDEX_ATTR = 'data-fragment-index';
  const ACTIVE_CLASS = 'fragment-active';
  const VISIBLE_CLASS = 'fragment-visible';
  let stepGroups = [];
  let currentStepIndex = -1;
  let lastActiveSlide = null;
  let blackoutEl = null;
  let touchStartX = null;

  function getActiveSlide() {
    const activeInWrapper = document.querySelector(
      'svg.bespoke-marp-active section, .bespoke-marp-active section, svg[data-marpit-svg]:not([aria-hidden="true"]) section',
    );
    if (activeInWrapper) return activeInWrapper;
    const explicit = document.querySelector('section.bespoke-marp-active, section[aria-hidden="false"]');
    if (explicit) return explicit;
    return document.querySelector('section');
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

    const rawNodes = Array.from(slide.querySelectorAll(`[${FRAGMENT_ATTR}]`));
    const usedSteps = new Set();
    rawNodes.forEach((el) => {
      const raw = (el.getAttribute(FRAGMENT_ATTR) || '').trim();
      const parsed = parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) usedSteps.add(parsed);
    });

    let autoStep = 1;
    const groupMap = new Map();
    rawNodes.forEach((el) => {
      const raw = (el.getAttribute(FRAGMENT_ATTR) || '').trim();
      const parsed = parseInt(raw, 10);
      let step = parsed;
      if (!Number.isFinite(parsed) || parsed <= 0) {
        while (usedSteps.has(autoStep)) autoStep += 1;
        step = autoStep;
        usedSteps.add(autoStep);
        autoStep += 1;
      }
      if (!groupMap.has(step)) groupMap.set(step, []);
      groupMap.get(step).push(el);
    });

    const sortedSteps = Array.from(groupMap.keys()).sort((a, b) => a - b);
    stepGroups = sortedSteps.map((step) => groupMap.get(step));

    stepGroups.forEach((group, groupIdx) => {
      group.forEach((el) => {
        el.setAttribute(FRAGMENT_INDEX_ATTR, String(groupIdx));
        el.classList.remove(ACTIVE_CLASS, VISIBLE_CLASS);
        el.querySelectorAll('[data-count-to]').forEach((c) => {
          delete c.dataset.counted;
        });
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

    currentStepIndex = -1;
    updateSlideProgress();
  }

  function showFragment(targetIndex) {
    if (stepGroups.length === 0) return;

    targetIndex = Math.max(-1, Math.min(targetIndex, stepGroups.length - 1));

    if (targetIndex > currentStepIndex) {
      for (let g = currentStepIndex + 1; g <= targetIndex; g++) {
        const group = stepGroups[g] || [];
        group.forEach((el) => {
          requestAnimationFrame(() => {
            el.classList.add(VISIBLE_CLASS);
            if (g === targetIndex) {
              el.classList.add(ACTIVE_CLASS);
            } else {
              el.classList.remove(ACTIVE_CLASS);
            }
            animateCountersInScope(el);
            replayMetersInScope(el);
          });
        });
      }
      for (let g = 0; g < targetIndex; g++) {
        (stepGroups[g] || []).forEach((el) => el.classList.remove(ACTIVE_CLASS));
      }
    } else if (targetIndex < currentStepIndex) {
      for (let g = currentStepIndex; g > targetIndex; g--) {
        const group = stepGroups[g] || [];
        group.forEach((el) => {
          el.classList.remove(ACTIVE_CLASS, VISIBLE_CLASS);
          el.querySelectorAll('[data-count-to]').forEach((c) => {
            delete c.dataset.counted;
          });
        });
      }
    }

    currentStepIndex = targetIndex;
    updateSlideProgress();
  }

  function nextFragment() {
    if (stepGroups.length === 0) return false;
    if (currentStepIndex < stepGroups.length - 1) {
      showFragment(currentStepIndex + 1);
      return true;
    }
    return false;
  }

  function prevFragment() {
    if (stepGroups.length === 0) return false;
    if (currentStepIndex > -1) {
      showFragment(currentStepIndex - 1);
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
    if (stepGroups.length > 0) {
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
    const counter = document.querySelector('.fragment-counter');
    if (stepGroups.length > 0) {
      const label = `${currentStepIndex + 1}/${stepGroups.length}`;
      if (slide) slide.setAttribute('data-fragment-progress', label);
      if (counter) {
        counter.textContent = `Step ${label}`;
        counter.style.opacity = '0.85';
      }
    } else {
      if (slide) slide.removeAttribute('data-fragment-progress');
      if (counter) {
        counter.textContent = '';
        counter.style.opacity = '0';
      }
    }
  }

  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.target && (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'b' || e.key === 'B' || e.key === '.') {
        e.preventDefault();
        e.stopImmediatePropagation();
        toggleBlackout();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        e.stopImmediatePropagation();
        replaySlideAnimations();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopImmediatePropagation();
        nextFragment();
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopImmediatePropagation();
        prevFragment();
        return;
      }

      if (e.key === ' ' || e.key === 'PageDown') {
        if (nextFragment()) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }

      if (e.key === 'PageUp') {
        if (prevFragment()) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        e.stopImmediatePropagation();
        resetFragments();
      } else if (e.key === 'End') {
        e.preventDefault();
        e.stopImmediatePropagation();
        showFragment(stepGroups.length - 1);
      } else if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'pm:host-key', key: e.key }, '*');
        }
      }
    }, true);

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
        dispatchBespokeNext();
      } else {
        dispatchBespokePrev();
      }
    }, { passive: true });
  }

  function dispatchBespokeNext() {
    const btn = document.querySelector('[data-bespoke-marp-osc="next"]');
    if (btn && typeof btn.click === 'function') {
      btn.click();
      return;
    }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, which: 39, bubbles: true }));
    document.dispatchEvent(new CustomEvent('bespoke:next'));
  }

  function dispatchBespokePrev() {
    const btn = document.querySelector('[data-bespoke-marp-osc="prev"]');
    if (btn && typeof btn.click === 'function') {
      btn.click();
      return;
    }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', keyCode: 37, which: 37, bubbles: true }));
    document.dispatchEvent(new CustomEvent('bespoke:prev'));
  }

  function bindMessages() {
    window.addEventListener('message', (e) => {
      const data = e.data;
      if (!data || typeof data !== 'object' || data.type !== 'pm:nav') return;
      if (data.action === 'next-fragment') nextFragment();
      else if (data.action === 'prev-fragment') prevFragment();
      else if (data.action === 'next-slide') dispatchBespokeNext();
      else if (data.action === 'prev-slide') dispatchBespokePrev();
      else if (data.action === 'replay') replaySlideAnimations();
      else if (data.action === 'blackout') toggleBlackout();
    });
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
    bindMessages();
    observeBespokeSlides();
    window.addEventListener('hashchange', onSlideChange);
    document.addEventListener('bespoke:slidechange', onSlideChange);
    document.addEventListener('bespoke:activate', onSlideChange);
  }

  init();
})();