# Ajaysinh Barad — personal website

A lightweight, portable website and self-hosted content studio. The runtime uses only Node.js built-in modules; no package installation or external service is needed to run it locally.

## Start locally (Windows PowerShell)

Open PowerShell in this folder and run:

```powershell
$env:STUDIO_PASSWORD = Read-Host "Choose a Studio password"
$env:SESSION_SECRET = node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
node server.mjs
```

Open `http://127.0.0.1:4173` for the public site and `http://127.0.0.1:4173/studio` to edit it. If the two environment variables are not set, Studio fails closed and will not accept logins. Set a long, unique password. The server binds to localhost by default.

## Deploying

This project is a small Node HTTP server, not a static-only site. Choose a host that can run Node.js and persist files. Configure these environment variables in the host dashboard:

- `STUDIO_PASSWORD`: a long, unique administrator password.
- `SESSION_SECRET`: a cryptographically random secret, separate from the password.
- `SITE_URL`: the canonical public origin, such as `https://ajaysinh.com`.
- `COOKIE_SECURE=1`: enable when HTTPS is configured.
- `HOST=0.0.0.0` and `PORT`: set as required by the host.

Terminate TLS at the host or reverse proxy. Back up `content/site.json` and `public/uploads/` together. Test backup restoration before relying on it. Do not put secrets in source control. The in-memory login session is cleared whenever the server restarts. Use a host with persistent disk, or adapt the storage layer to its durable storage service before deploying to an ephemeral filesystem.

The portfolio copy and project summaries were transcribed from the public pages on ajaysinh.com. The local preview does not copy the live project imagery or private case-study details. Review any role, dates, outcomes, media rights, and confidentiality before publishing changes. Studio edits are written directly to `content/site.json` and become public immediately when saved.

## Included

- Responsive pages: home, work index and case studies, thinking and articles, about, experience, experiments, now, uses, contact, search, privacy and a not-found state.
- CMS editor with password-gated sessions, editable site identity and pages, project and article management, experience timeline, media uploads, and JSON content backup/restore.
- A visitor journey rail, illustrated route map, backtrack/next-turn wayfinding, and project stories organized as landscape, challenge, choices and outcome.
- A restrained color system and a locally bundled Montserrat variable font (with a system-font fallback). The Google Fonts Open Font License is included beside the font.
- XML sitemap, robots.txt, and an RSS feed for published writing.
- Keyboard skip link, mobile navigation, light/dark mode, reduced-motion support, semantic HTML and lazy-loaded story imagery.
- No analytics, advertising scripts or frontend package dependencies.

## Content and files

- `content/site.json` — portable structured content.
- `public/` — frontend, CSS, script, favicon and uploaded media.
- `server.mjs` — HTTP server, CMS API, uploads and sitemap/RSS routes.

The Studio upload limit is 30 MB per image or video. Uploaded assets can be referenced from a project/article using the `/uploads/...` URL shown in the Media tab. Keep independent backups of the media folder as well as the content JSON.
