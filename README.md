# Clean Outlook (Ad Blocker)

Install: `chrome://extensions` → enable Developer mode → Load unpacked → select this folder. Reload Outlook.

It hides the sponsored email row **and** its empty wrapper (the blue-bordered blank row left by other blockers), plus the sidebar ad, upgrade/bottom banners and the "Buy Microsoft 365" button.

If an ad stops being removed, Outlook changed its markup: edit `SELECTORS` / `AD_TEXT` at the top of `content.js`.
