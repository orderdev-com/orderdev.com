# orderdev.com monorepo

dev requirements:
```
- install node v20.11.0
    https://github.com/nvm-sh/nvm?tab=readme-ov-file#intro
    use nvm to install node

- install pnpm v8.14.1
    https://pnpm.io/installation#using-npm
    npm install -g pnpm

- install turso v0.96.0
    https://docs.turso.tech/cli/introduction

- install caddy v2.8.4
    https://caddyserver.com/docs/install
```


add hosts file entries
```
127.0.0.1 store.orderdev.local
```

run dev:
```
pnpm i
mkdir -p ./packages/turso-local/dev-sqlite
pnpm db-generate-migrate
pnpm dev
```

then open https://store.orderdev.local in browser