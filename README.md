# orderdev.com monorepo

dev requirements:
```
install node 18+
install turso v0.96.0+
```

run dev:
```
pnpm i
mkdir -p ./packages/turso-local/dev-sqlite
pnpm db-generate-migrate
pnpm dev
```