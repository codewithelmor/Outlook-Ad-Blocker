const DEFAULTS = { listAds: true, sidebar: true, banners: true, upsell: true };
chrome.storage.sync.get(DEFAULTS, (s) => {
  document.querySelectorAll('input[data-k]').forEach((i) => {
    i.checked = s[i.dataset.k];
    i.addEventListener('change', () => chrome.storage.sync.set({ [i.dataset.k]: i.checked }));
  });
});
chrome.storage.local.get({ removedCount: 0 }, (s) => {
  document.getElementById('count').textContent = `Removed this session: ${s.removedCount}`;
});
