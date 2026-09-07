# Hunt Home Improvements website

This is a single, portable Node website: the public-facing pages are fast static files, while the Node server provides a protected estimate-request endpoint.

## What is included

- A redesigned, mobile-friendly marketing site with Home, Services, About, work gallery, and estimate-request contact sections.
- No Kris's Blog, Online Bill Pay, or We're Hiring links or pages.
- All 117 original images from the public WordPress media library plus the public video thumbnail in `assets/images/`; `assets/source-media.json` preserves source URLs and original descriptions.
- Contact protections: request throttling, a bot-trap field, strict server-side limits and validation, Cloudflare Turnstile verification, and no visitor data stored on the server.
- Email delivery through Resend; replies go directly to the prospective customer's email address.

## Local use

1. Copy `.env.example` to `.env` and fill in the email and Turnstile values.
2. Install packages with `npm install`.
3. Start with `npm run dev`.

Without email credentials, the preview site works but intentionally does not accept estimate requests.

## Deploying

Railway is the recommended host for this build: connect the project repository, add the values from `.env.example` in its Variables page, and set the custom domain. It runs the `start` script automatically. This keeps the site and form in one place, while Resend handles reliable outbound email and Turnstile filters automated submissions.

## Asset provenance

The image files were downloaded on September 2, 2026 from the public Hunt Home Improvements WordPress media library. Keep the original files in `assets/images/`; select optimized copies later only after a visual review.
