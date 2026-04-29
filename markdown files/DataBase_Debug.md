# Database Debug

## What happened

Running:

```bash
npm run db:migrate
```

failed with:

```text
Error: No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?
```

## What is wrong with the database

Based on the data collected, there is no evidence that the PostgreSQL database itself is broken.

The migration failed **before** it connected to the database, so the database was never reached.

## What is wrong in the code

The issue is in the app's database bootstrap and migration setup:

1. `db/index.ts` creates the Neon client with `process.env.DATABASE_URL!`.
2. `db/migrate.ts` is run with `tsx ./db/migrate.ts`.
3. Standalone `tsx` scripts do **not** automatically load Next.js environment files like `.env.local`.
4. That means `process.env.DATABASE_URL` is `undefined` at runtime.
5. The non-null assertion (`!`) only affects TypeScript checking and does not protect runtime code.

## Files involved

### `db/index.ts`

Current pattern:

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
```

### `db/migrate.ts`

Current pattern:

```ts
import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "./index";

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("Migration completed");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
};

main();
```

### `drizzle.config.ts`

Current pattern:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Recommended code changes

### 1. Load env vars in `db/migrate.ts`

Update `db/migrate.ts` to load env vars before importing `db`:

```ts
import "dotenv/config";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "./index";

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("Migration completed");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
};

main();
```

### 2. Load env vars in `drizzle.config.ts`

Update `drizzle.config.ts` so Drizzle CLI commands can also read `DATABASE_URL`:

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 3. Improve `db/index.ts` error handling

Update `db/index.ts` to fail early with a clear message:

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });
```

## How to export `DATABASE_URL` in the shell

### Option 1: Load from `.env.local`

From the repo root:

```bash
set -a
source .env.local
set +a
```

Confirm it is set:

```bash
[ -n "$DATABASE_URL" ] && echo "DATABASE_URL is set"
```

Then run:

```bash
npm run db:migrate
```

### Option 2: Export manually

```bash
export DATABASE_URL='your-connection-string-here'
npm run db:migrate
```

## Root cause summary

The root cause is:

**Next.js loads `.env.local` for the application, but `tsx ./db/migrate.ts` does not automatically load it.**

Because of that, the migration script starts without `DATABASE_URL`, and the Neon client throws before any database connection is attempted.

# Solution

- I added these lines of code to the index.ts file

```ts
import { config } from "dotenv";

config({ path: ".env.local})
```

- I then ran

```bash
npm run db:migrate
```

**It ran perfectly!**

I also removed this line from `db/migrate.ts` and `drizzle.config.ts`
```ts
import "dotenv/config";
```
from `db/migrate.ts` and `drizzle.config.ts` and everything still works perfectly.

It did however give me this comment:

tip: prvent committing .env to code: https://dotenvx.com/precommit

Look into what exactly this means 