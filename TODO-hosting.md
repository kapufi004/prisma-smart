# TODO - Host prisma-smart with Railway MySQL

- [x] Update `app.js` to use `process.env.PORT` (fallback 3000)
- [x] Add proper session configuration for production (cookie settings)
- [x] Create `.env` with `DATABASE_URL` (Railway will provide it automatically as well)
- [x] Add Railway-friendly start script in `package.json` (`npm run railway-start`) that runs:
  - `prisma generate`
  - `prisma migrate deploy`
  - `node app.js`
- [ ] Deploy and verify routes: `/`, `/products/:id/order`, `/login`, `/dashboard`, `/orders`

## Railway setup (MySQL)
1. Create a new **Project** on Railway.
2. Add **Database** → choose **MySQL** (Railway MySQL).
3. Ensure the Railway app has the env var `DATABASE_URL` (Railway typically injects this automatically).
4. (Recommended) Set `SESSION_SECRET` in Railway environment variables.
5. In **Settings → Start Command**, set:
   - `npm run railway-start`
6. Deploy.

## Route verification checklist (after deploy)
- Home page `/` loads product cards
- Product order page `/products/:id/order` loads and order form renders
- Submit order to POST `/order` and redirect back to `/`
- Login `/login` and protected dashboard `/dashboard`
- Orders page `/orders` shows orders


