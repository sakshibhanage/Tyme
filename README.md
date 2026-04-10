# Tyme

**Tyme** is a small web app for sealing a personal note (and optional photo) into a shareable link or an email invitation. You can send it right away or **time-lock** it so the recipient only sees the memory after a date you choose.

Live concept: **memories sealed in time** — warm stationery-style UI, optional 3D moments on the landing experience, and a dedicated **open** page where the capsule unlocks or shows a countdown until it does.

Repository: [github.com/sakshibhanage/Tyme](https://github.com/sakshibhanage/Tyme)

## What’s on the site

| Area | Path | Purpose |
|------|------|--------|
| **Home / Tyme** | `/` | Landing and entry into the product story |
| **Seal a memory** | `/tyme/seal` | Write a title & message, optional image, lock mode (anytime or scheduled), then invite by **email** |
| **Open a memory** | `/open#c=…` | Recipient opens the sealed capsule (or sees **time locked** countdown until unlock) |
| **Jasmine** | `/jasmine` | Separate portfolio-style section |

Capsule data is encoded in the URL fragment (`#c=`) so large payloads (e.g. photos) don’t blow past HTTP header limits. Invitation emails are sent with [Resend](https://resend.com); the message includes a short note and an **Open memory** button.

## Stack

- **Next.js** (App Router), **React**, **TypeScript**
- **Tailwind CSS**, **GSAP**
- **Three.js** / **React Three Fiber** for select 3D UI
- **Resend** for transactional / scheduled invite mail

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build && npm start   # production build
```

## Environment

Copy `.env.example` to `.env.local` and fill in:

| Variable | Role |
|----------|------|
| `RESEND_API_KEY` | Send invitation emails |
| `RESEND_FROM` | Verified sender, e.g. `Name <hello@yourdomain.com>` |
| `NEXT_PUBLIC_APP_URL` | Public site URL (e.g. `https://yourdomain.com`) for correct share links and invite validation |
| `TYME_ENV_IMAGE` | Optional HTTPS image shown at the top of invite emails |

`.env.local` is gitignored — never commit secrets.

## License

Private / all rights reserved unless you add an explicit license file.
