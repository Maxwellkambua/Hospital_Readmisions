/* =========================================================
   POLISH — additive micro-enhancements
   Does not modify or depend on any existing JS logic.
   ========================================================= */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  /* -----------------------------------------------------------
     1. Animated KPI number counting
     Watches .kpi__value elements and rolls them from old → new
     ----------------------------------------------------------- */
  function parseValue(str) {
    // Extract number + optional prefix/suffix: "$1.2M", "18,000", "17.3%", "1.042"
    const m = str.match(/^([^\d\-.]*)(-?\d[\d,]*\.?\d*)(.*)$/);
    if (!m) return null;
    const [, prefix, numStr, suffix] = m;
    const numeric = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(numeric)) return null;
    const decimals = (numStr.split('.')[1] || '').length;
    const hasComma = numStr.includes(',');
    return { prefix, suffix, numeric, decimals, hasComma };
  }

  function formatValue(parsed, value) {
    let out = value.toFixed(parsed.decimals);
    if (parsed.hasComma) {
      const parts = out.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      out = parts.join('.');
    }
    return parsed.prefix + out + parsed.suffix;
  }

  function animateNumber(el) {
    if (el.dataset.animating === 'true') return;
    const target = el.textContent.trim();
    const parsed = parseValue(target);
    if (!parsed) return;

    const prev = el.dataset.prevValue ? parseFloat(el.dataset.prevValue) : null;
    el.dataset.prevValue = parsed.numeric;

    // Skip animation on first observation
    if (prev === null || prev === parsed.numeric) return;

    el.dataset.animating = 'true';
    const from = prev;
    const to = parsed.numeric;
    const duration = 620;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = from + (to - from) * eased;
      el.textContent = formatValue(parsed, current);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = formatValue(parsed, to);
        el.dataset.animating = 'false';
      }
    }
    requestAnimationFrame(tick);
  }

  const kpiObserver = new MutationObserver(mutations => {
    const touched = new Set();
    mutations.forEach(m => {
      if (m.type === 'characterData') {
        touched.add(m.target.parentElement);
      } else if (m.type === 'childList') {
        touched.add(m.target);
      }
    });
    touched.forEach(node => {
      if (node.classList && node.classList.contains('kpi__value')) {
        animateNumber(node);
      }
    });
  });

  function initKpiObserver() {
    document.querySelectorAll('.kpi__value').forEach(el => {
      el.dataset.prevValue = el.textContent.replace(/[^\d.-]/g, '');
      kpiObserver.observe(el, { characterData: true, childList: true, subtree: true });
    });
  }

  /* Also watch for newly added KPI elements (tab switches) */
  const rootObserver = new MutationObserver(() => {
    document.querySelectorAll('.kpi__value:not([data-observed])').forEach(el => {
      el.dataset.observed = '1';
      el.dataset.prevValue = el.textContent.replace(/[^\d.-]/g, '');
      kpiObserver.observe(el, { characterData: true, childList: true, subtree: true });
    });
  });

  /* -----------------------------------------------------------
     2. Chart entrance stagger
     ----------------------------------------------------------- */
  function staggerCharts() {
    document.querySelectorAll('.chart').forEach((chart, i) => {
      chart.style.animationDelay = (i * 40) + 'ms';
    });
  }

  /* -----------------------------------------------------------
     3. Button ripple (subtle)
     ----------------------------------------------------------- */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn--primary, .icon-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position: absolute;
      left: ${e.clientX - rect.left - size/2}px;
      top:  ${e.clientY - rect.top  - size/2}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
      transform: scale(0);
      animation: ripple 600ms ease-out forwards;
      pointer-events: none;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 620);
  });

  // Inject ripple keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to { transform: scale(2.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  /* -----------------------------------------------------------
     Init
     ----------------------------------------------------------- */
  function init() {
    initKpiObserver();
    rootObserver.observe(document.body, { childList: true, subtree: true });
    staggerCharts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();