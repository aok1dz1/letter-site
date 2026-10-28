# Letter Site

A static HTML site for creating personal letters with a pink animated envelope, optional background photography, and draggable personal photos.

## How it works

- `index.html` contains the editor, responsive styling, envelope animation, photo placement canvas, cropping shapes and frames.
- Creating a letter calls the public Supabase Edge Function `letter-api`.
- Text and layout settings are saved in `public.letters`.
- Image files are uploaded to the public Supabase Storage bucket `letter-media`.
- The share link contains only a random 16-character ID, for example `https://letter-site-sand.vercel.app/?l=0123456789abcdef`.
- Legacy links using `#letter=...` remain supported.

## Production resources

- Vercel domain: `https://letter-site-sand.vercel.app`
- Supabase project ref: `ennhfbjuyifzughuahhw`
- Edge Function: `letter-api`
- Storage bucket: `letter-media`

The browser uses only the Supabase publishable key. The Edge Function uses the server-side service key from Supabase's default environment; never add a service-role/secret key to `index.html` or commit one to GitHub.

## Deploy

### Website
Vercel is connected to `aok1dz1/letter-site` and deploys commits to `main`. The site is static HTML, so no frontend build command is required.

### Supabase function
The deployed function source is versioned at `supabase/functions/letter-api/index.ts`. The config in `supabase/config.toml` sets `verify_jwt = false` because the public letter page calls the endpoint with the publishable key. The function validates the key, checks request sizes, rate-limits creation attempts, validates photo metadata, stores uploaded images and returns a short ID.

After changing the function source, link the Supabase CLI to project `ennhfbjuyifzughuahhw` and deploy `letter-api`. Do not copy any Supabase secret/service-role key into client-side code.

### Database and storage
The migrations in `supabase/migrations/` correspond to the applied schema versions:
- `20261027191625_create_letter_storage_and_rate_limits.sql`
- `20261027191648_use_64_bit_letter_ids.sql`

The letters table has RLS enabled and no direct public read/write grants; only the server-side function accesses it. The media bucket is public-read because recipients must load photos without signing in. Therefore, anyone who has a letter link can view its text and photos. Do not upload sensitive/private images.

## Photo editor
Upload up to fifteen personal photos across multiple selection batches; newly selected photos append without replacing earlier ones. Click a thumbnail to select it, drag it on the placement mockup, and choose crop shape, frame, size, and rotation. The full-screen recipient photo viewer supports pinch-to-zoom on touchscreens and zoom buttons/wheel on desktop. Background images and personal photos upload when the letter is saved, not into the URL. The envelope-opening animation remains in the frontend and is independent of persistence.


## Bouquet builder

The main page has a mode switch for letters and digital bouquets. Bouquet artwork is generated from original inline SVG illustrations (rose, peony, tulip, daisy, lily, sunflower, anemone and lavender), so it does not depend on copied third-party flower assets.

The editor supports up to 15 flowers, drag placement, per-flower rotation and scale, four greenery styles, six card treatments, and eight background themes. Bouquet data is stored in the same `public.letters` table through the `letter-api` Edge Function and uses the same short `?l=<id>` link pattern. Recipients can reposition flowers on their device; those recipient-side changes are saved locally and do not overwrite the sender's original arrangement.
