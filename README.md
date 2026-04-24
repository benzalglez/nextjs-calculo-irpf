# Calculadora IRPF y nominas

Onepage en Next.js para calcular coste laboral, cotizaciones, IRPF, salario neto y comparativa de poder adquisitivo ajustada por IPC.

## Desarrollo

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Verificacion

```bash
npm run verify:payroll
npm run build
```

## Cloudflare Workers

El proyecto esta preparado para desplegar Next.js en Cloudflare Workers con `@opennextjs/cloudflare` y `wrangler`.

Preview local en runtime de Workers:

```bash
npm run preview
```

Deploy local:

```bash
npm run deploy
```

Configuracion para Workers Builds conectando este repo desde Cloudflare:

- Build command: `npx @opennextjs/cloudflare build`
- Deploy command: `npx @opennextjs/cloudflare deploy`

La configuracion vive en `wrangler.jsonc` y `open-next.config.ts`.
