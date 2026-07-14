# Credit Flow

Multi-currency credits wallet and campaign funding platform for an influencer-marketing product. Users buy credits in three independent currencies via Stripe and spend them within their bound modules (e.g. Campaign Credits fund campaigns).

## Structure

- `backend/` — Node.js + TypeScript + Express + Sequelize (MySQL)
- `frontend/` — React + Vite + TypeScript

## Prerequisites

- Node.js 20+
- MySQL 8.0.16+ or MariaDB 10.2.1+ (both are required for enforced `CHECK` constraints)

## Backend setup

```bash
cd backend
npm install
cp .env.example .env   # edit DB_* and JWT_SECRET as needed
```

Create the database (name must match `DB_NAME` in `.env`):

```sql
CREATE DATABASE credit_flow;
```

Run migrations:

```bash
npm run db:migrate
```

Seed the three platform currencies (Campaign, Report, Discovery Credits) and their plans:

```bash
npm run db:seed
```

Other useful commands:

```bash
npm run db:migrate:undo       # roll back the most recent migration
npm run db:migrate:undo:all   # roll back every migration
npm run dev                   # start the API in watch mode
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # edit VITE_API_URL if the backend isn't on localhost:3000
npm run dev
```
