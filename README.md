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
127.0.0.1 store.order.dev
127.0.0.1 store2.order.dev
127.0.0.1 store3.order.dev
127.0.0.1 api.order.dev
```

run dev:
```
pnpm i
mkdir -p ./packages/turso-local/dev-sqlite
pnpm db-generate
pnpm db-migrate
pnpm dev
```

then open https://store.order.dev in browser