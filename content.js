/* Clean Outlook - content script.
 * Outlook's list is react-virtuoso: sponsored rows are either the list HEADER
 * (a sibling just before [data-testid="virtuoso-item-list"]) or a normal item
 * wrapped in div[data-item-index]. We hide the whole wrapper, not just its content,
 * so no empty bordered shell is left behind.
 */
(() => {
  'use strict';

  const DEFAULTS = { listAds: true, sidebar: true, banners: true, upsell: true };
  let settings = { ...DEFAULTS };
  let removed = 0;

  const SELECTORS = {
    sidebar: [
      '[data-app-section="AdsPane"]', '[id*="AdsPane" i]', '[aria-label="Advertisement" i]'
    ],
    banners: [
      '[data-app-section="UpsellBanner"]', '[data-app-section="UpsellBannerSection"] > :not([data-focus-trap-dummy])',
      '[data-app-section="BottomAd"]'
    ],
    upsell: [
      '#owaBuyMicrosoft365Btn_container', 'button[aria-label*="Buy Microsoft 365" i]'
    ]
  };

  function mark(el, key) {
    if (!el || el.hasAttribute('data-oab-hidden')) return;
    el.setAttribute('data-oab-hidden', key);
    removed++;
  }

  /** From an "Ad" marker, climb to the element that should be hidden. */
  function listAdRoot(marker) {
    let el = marker;
    while (el.parentElement) {
      const p = el.parentElement;
      if (p.hasAttribute('data-item-index')) return p;                       // regular virtuoso item
      if (p.querySelector(':scope > [data-testid="virtuoso-item-list"]')) return el; // list header
      if (p.matches('[data-virtuoso-scroller], [role="listbox"]')) return null;
      el = p;
    }
    return null;
  }

  function hideListAds() {
    const scope = document.querySelector('[data-app-section="MessageList"]') || document;
    const markers = new Set(scope.querySelectorAll('img[src*="ads-olk-icon"]'));
    scope.querySelectorAll('div, span').forEach((n) => {
      if (n.childElementCount === 0 && n.textContent.trim() === 'Ad' && n.closest('[data-testid="virtuoso-scroller"]')) {
        markers.add(n);
      }
    });
    markers.forEach((m) => {
      const root = listAdRoot(m);
      if (root) mark(root, 'listAds');
    });
  }

  /** "It looks like you're using an ad blocker ... Ad Choices" bars. */
  function hideBottomBars() {
    document.querySelectorAll('img[src*="adbarmetrochoice"]').forEach((img) => {
      let el = img;
      while (el.parentElement && !/Ad-Free Outlook/i.test(el.textContent || '')) el = el.parentElement;
      if (el.parentElement && el !== document.body) {
        const bar = el.parentElement;               // wrapper of the message+Ad Choices block
        if (!bar.querySelector('[role="listbox"], [role="main"]')) mark(bar, 'banners');
      }
    });
  }

  function hideBySelectors(key) {
    for (const sel of SELECTORS[key]) {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.querySelector('[role="listbox"], [role="main"]')) return;
        mark(el, key);
      });
    }
  }

  let queued = false;
  function run() {
    queued = false;
    if (settings.listAds) hideListAds();
    if (settings.banners) hideBottomBars();
    for (const k of ['sidebar', 'banners', 'upsell']) if (settings[k]) hideBySelectors(k);
    try { chrome.storage.local.set({ removedCount: removed }); } catch (_) {}
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  function restoreAll() {
    document.querySelectorAll('[data-oab-hidden]').forEach((e) => e.removeAttribute('data-oab-hidden'));
    removed = 0;
  }

  function init() {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    schedule();
  }

  try {
    chrome.storage.sync.get(DEFAULTS, (s) => {
      settings = { ...DEFAULTS, ...s };
      init();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      for (const k in changes) settings[k] = changes[k].newValue;
      restoreAll();
      schedule();
    });
  } catch (_) {
    init();
  }
})();
