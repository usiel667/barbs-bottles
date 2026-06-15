# Cloudflare Tunnel — Local Device Testing

Use this when you want to view the app on another device (phone, tablet) while developing locally.

## Why It's Needed

Kinde Auth requires HTTPS for all redirect URIs — `localhost` is the only HTTP exception. A local IP like `http://10.0.0.92:3000` won't work. Cloudflare Tunnel provides a public HTTPS URL that proxies to your local dev server.

## One-Time Setup

`allowedDevOrigins` in `next.config.ts` already includes the `10.0.0.92` local IP. Add any new Cloudflare URL there each session (see step 4 below).

## Each Session

**1. Start the dev server**
```
npm run dev
```

**2. Start the tunnel** (in a second terminal)
```
cloudflared tunnel --url http://localhost:3000
```
Copy the `https://something.trycloudflare.com` URL from the output.

**3. Update `.env.local`** — replace all three `KINDE_*` URL values:
```
KINDE_SITE_URL=https://YOUR-URL.trycloudflare.com
KINDE_POST_LOGOUT_REDIRECT_URL=https://YOUR-URL.trycloudflare.com
KINDE_POST_LOGIN_REDIRECT_URL=https://YOUR-URL.trycloudflare.com/home
```

**4. Update `next.config.ts`** — add the new subdomain to `allowedDevOrigins`:
```ts
allowedDevOrigins: ["10.0.0.92", "YOUR-URL.trycloudflare.com"],
```

**5. Add callback URL to Kinde dashboard**
- Allowed callback URLs: `https://YOUR-URL.trycloudflare.com/api/auth/kinde_callback`
- Allowed logout redirect URLs: `https://YOUR-URL.trycloudflare.com`

**6. Restart the dev server** to pick up the `.env.local` changes.

**7. Open on your device:** `https://YOUR-URL.trycloudflare.com`

## Notes

- The Cloudflare URL changes every session — repeat steps 2–6 each time.
- This only works on the same WiFi network or while the tunnel is running. Cell signal won't reach your local machine.
- Do not commit `.env.local` — it contains secrets.
- Revert `.env.local` back to `localhost` URLs when done with device testing.
