# PWA Setup Instructions

## Icon Requirements

To complete the PWA setup, you need to create two icon files:

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

### Creating Icons

You can create these icons using:
- Any image editor (Photoshop, GIMP, etc.)
- Online tools like https://realfavicongenerator.net/

The icons should:
- Be square PNG images
- Be recognizable at small sizes

### Quick Icon Creation

If you have a logo image, you can:
1. Resize it to 192x192 and save as `icon-192.png`
2. Resize it to 512x512 and save as `icon-512.png`

## Testing the PWA

1. **Local Testing:**
   - Serve the files using a local server (not just opening index.html)
   - Use `python -m http.server` or `npx serve` in the project directory
   - Open in Chrome and check DevTools > Application > Manifest

2. **Install on Mobile:**
   - Open the app in Chrome/Safari on your phone
   - Look for "Add to Home Screen" prompt
   - Or use browser menu > "Add to Home Screen"

3. **Offline Testing:**
   - Open the app
   - Turn on airplane mode
   - The app should still work offline

## Features Enabled

✅ Installable on mobile devices
✅ Works offline (cached resources)
✅ Standalone display mode (no browser UI)
✅ Theme color matching app design
✅ Portrait orientation lock

## Notes

- The service worker caches all app files for offline use
- Updates to the app will require updating the CACHE_NAME in service-worker.js
- Icons are required for the PWA to be installable
