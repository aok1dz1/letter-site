# Letter Site — animated envelope

Static site with a premium pink envelope, a staged envelope-opening animation, and a letter that physically flies out and expands into a readable full-screen sheet.

## Files
- `index.html` — page structure
- `styles.css` — responsive styling and envelope layers
- `script.js` — editor, share-link encoding, and Web Animations API transitions

## Deploy to Vercel
Import this repository from GitHub. Framework preset: Other. Build command: leave empty. Output directory: `.` (or leave the default if Vercel detects static files). No backend is required for this demo.

## Notes
Share links encode letter content in the URL. Do not use for sensitive messages. A production service with private or persistent letters should use server-side storage and access controls.
