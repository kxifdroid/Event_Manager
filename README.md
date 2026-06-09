# ClubMedia — Event & Media Management Platform

Production-ready full-stack web application for college clubs to manage events, albums, and media with AI-powered tagging, facial recognition, real-time notifications, and social features.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (credentials + optional Google OAuth) |
| Storage | Local filesystem (`public/uploads`) |
| AI | Google Cloud Vision API (auto-tagging), face-api.js (client-side face matching) |
| Real-time | Pusher |
| Image Processing | sharp (compress, thumbnail, watermark, pHash) |

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js App     │────▶│ PostgreSQL  │
│  (React)    │     │  API Routes      │     │  (Prisma)   │
└──────┬──────┘     └────────┬─────────┘     └─────────────┘
       │                     │
       | face-api.js         |--> Local uploads (media storage)
       │ (client)            ├──▶ Google Vision (tags)
       │                     ├──▶ Pusher (notifications)
       └─────────────────────┴──▶ sharp (watermark/pHash)
```

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (local, [Supabase](https://supabase.com), or [Neon](https://neon.tech))

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd event-media-platform
npm install

# 2. Environment
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, Vision, and Pusher keys

# 3. Database
npx prisma migrate dev --name init
npx prisma db seed

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts (after seed)

| Email | Password | Role |
|-------|----------|------|
| admin@club.edu | password123 | ADMIN |
| photo@club.edu | password123 | PHOTOGRAPHER |
| member@club.edu | password123 | MEMBER |
| viewer@club.edu | password123 | VIEWER |

## Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000`
- `GOOGLE_CLOUD_VISION_API_KEY` — Vision API key
- `PUSHER_*` / `NEXT_PUBLIC_PUSHER_*` — Pusher app credentials
- `CLUB_NAME` — (optional) watermark text prefix

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| * | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET/POST | `/api/events` | List/create events |
| GET/PATCH/DELETE | `/api/events/[id]` | Event CRUD |
| GET/POST | `/api/albums` | List/create albums |
| GET/PATCH/DELETE | `/api/albums/[id]` | Album CRUD |
| GET | `/api/media` | List media (cursor pagination) |
| POST | `/api/media/upload` | Upload media to local storage |
| GET/DELETE | `/api/media/[id]` | Media detail/delete |
| POST | `/api/media/[id]/like` | Toggle like |
| GET/POST/DELETE | `/api/media/[id]/comment` | Comments |
| POST | `/api/media/[id]/favourite` | Toggle favourite |
| POST | `/api/media/[id]/tag` | Tag user |
| GET | `/api/media/[id]/download` | Watermarked download |
| GET/PATCH | `/api/notifications` | Notifications |
| POST | `/api/ai/tag-image` | Vision auto-tagging |
| POST/PUT | `/api/ai/face-match` | Face match / save descriptor |
| GET | `/api/search` | Advanced media search |
| GET | `/api/profile/favourites` | User favourites |
| GET | `/api/admin/stats` | Admin statistics |

All API routes return: `{ data, error, status }`

## Folder Structure

```
/app
  /api          — REST API routes
  /(auth)       — Login, register
  /(dashboard)  — Dashboard, events, profile, admin, search
/components
  /ui           — shadcn/ui primitives
  /media        — MediaCard, MediaGrid, UploadZone, LightboxModal
  /events       — EventCard, EventForm
  /notifications— NotificationBell, NotificationList
  /layout       — Sidebar, Navbar, Footer
/lib            - prisma, storage, vision, watermark, pusher, auth
/prisma         — schema, migrations, seed
```

## Features

- **Role-based access**: ADMIN, PHOTOGRAPHER, MEMBER, VIEWER
- **Event & album management** with categories and public/private toggle
- **Bulk media upload** with drag-drop, compression, thumbnails, duplicate detection
- **Social**: like, comment, favourite, share, user tagging
- **Real-time notifications** via Pusher
- **AI auto-tagging** with Google Vision
- **Facial recognition** with face-api.js (client-side descriptor + server matching)
- **Watermarked downloads** for logged-in users
- **QR code album sharing**
- **Infinite scroll** media grids
- **Advanced search** with filters

## Deployment (Vercel + Supabase)

1. Push repo to GitHub
2. Create Supabase project → copy `DATABASE_URL`
3. Import project in [Vercel](https://vercel.com)
4. Add all env vars from `.env.example`
5. Deploy — `postinstall` runs `prisma generate`
6. Run migrations: `npx prisma migrate deploy` (via CI or Vercel build hook)

### Storage Notes

- Local development stores uploaded files under `public/uploads`.
- This is suitable for running without cloud credentials. For production on serverless hosts, use persistent storage because local files may not survive redeploys.

### Pusher

Create app at [pusher.com](https://pusher.com). Use same key/cluster for server and `NEXT_PUBLIC_*` vars.

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run lint       # ESLint
npm run format     # Prettier
npm run db:migrate # Prisma migrate
npm run db:seed    # Seed database
```

## License

MIT
