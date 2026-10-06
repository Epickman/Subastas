@AGENTS.md

# Subastas Ludovica — Documentación del proyecto

## Stack tecnológico

- **Framework**: Next.js 16.3.6 (App Router, React 19)
- **Base de datos**: Postgres en Neon vía `@neondatabase/serverless` (env `DATABASE_URL`, provista por la integración de Vercel)
- **Imágenes**: Vercel Blob público vía `@vercel/blob` (env `BLOB_READ_WRITE_TOKEN`)
- **Hosting**: Vercel, proyecto `subastas`, deploy automático al pushear a `main`
- **Estilos**: Tailwind CSS v4 + clases CSS personalizadas en `globals.css`
- **Fuentes**: Playfair Display (serif, elegante) + Inter (sans-serif, UI)
- **Tipado**: TypeScript 5
- `next/image` con `unoptimized: true` en `next.config.ts`

---

## Arquitectura general

```
app/
  layout.tsx              → Root layout (fuentes, html lang="es")
  page.tsx                → Redirige a /subasta
  globals.css             → Variables CSS, animaciones, clases utilitarias
  subasta/
    page.tsx              → Grilla pública de lotes (SSR, force-dynamic)
    [id]/page.tsx         → Detalle de un lote (SSR)
  admin/
    layout.tsx            → Layout del admin (nav con logo + logout)
    page.tsx              → Lista de lotes con editar/eliminar
    login/page.tsx        → Formulario de login (client component)
    DeleteButton.tsx      → Botón de eliminar con confirmación (client)
    LoteForm.tsx          → Formulario crear/editar lote (client)
    lotes/
      nuevo/page.tsx      → Página crear lote
      [id]/editar/page.tsx → Página editar lote
  api/
    lotes/route.ts        → GET (todos) + POST (crear)
    lotes/[id]/route.ts   → GET + PUT + DELETE por id
    upload/route.ts       → POST: emite token para subida directa del navegador a Vercel Blob (solo admin)
    img/[filename]/route.ts → (legado, ya no se usa) servía imágenes desde disco
    auth/
      login/route.ts      → POST: valida contraseña, setea cookie HMAC
      logout/route.ts     → POST: borra cookie admin_token
components/
  LoteMedia.tsx           → Renderiza imagen (next/image) o <video> según extensión
lib/
  auth.ts                 → computeToken / isAdminToken (HMAC), compartido por proxy, login y upload
  media.ts                → Extensiones de imagen/video, esVideo (sin deps de servidor)
  db.ts                   → Cliente Neon lazy, crea tabla lotes si no existe
  lotes.ts                → CRUD, tipos, formatPrecio, ESTADO_CONFIG
proxy.ts                  → Middleware de auth para rutas /admin/*
```

---

## Base de datos — tabla `lotes`

| Campo | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| numero_lote | TEXT NOT NULL | Ordena como entero si es posible |
| nombre | TEXT NOT NULL | |
| descripcion | TEXT | Default '' |
| imagen | TEXT | URL pública de Vercel Blob (imagen o video, según extensión) |
| estado | TEXT | `pendiente` / `subastado` |
| ganador | TEXT | Nombre del ganador |
| precio_final | DOUBLE PRECISION | 0 si no subastado |
| precio_base | DOUBLE PRECISION | 0 si no tiene; columna agregada con ALTER en `ensureSchema` |
| created_at | TEXT | datetime localtime |
| updated_at | TEXT | datetime localtime |

Fechas guardadas como texto en hora de Buenos Aires. Las funciones de `lib/lotes.ts` son async.

---

## Autenticación admin

- Contraseña comparada directamente contra `ADMIN_PASSWORD` (env var, default `subasta2024`)
- Token = HMAC-SHA256(password, ADMIN_SECRET), almacenado en cookie `admin_token` (httpOnly, 7 días)
- El middleware `proxy.ts` protege todas las rutas `/admin/*` excepto `/admin/login`
- **Importante**: en producción hay que setear `ADMIN_PASSWORD` y `ADMIN_SECRET` como variables de entorno seguras

---

## Imágenes

- Imágenes (jpg/png/webp/gif) o videos (mp4/mov/webm/m4v, hasta 500 MB) se suben desde el navegador directo a Vercel Blob con `upload()` de `@vercel/blob/client` (multipart si > 20 MB), en `lotes/<uuid>.<ext>`; `/api/upload` solo emite el token y exige cookie de admin
- La URL pública se guarda en `imagen`; los videos se muestran en loop sin sonido en grilla/admin y con controles en el detalle

---

## Design system

Paleta de colores (definida en `globals.css` y en componentes inline):

| Variable | Valor | Uso |
|---|---|---|
| `--color-gold` | `#c8a96e` | Acento dorado, precios, badges de lote |
| `--color-night` | `#080808` | Fondo principal |
| `--color-surface` | `#111111` | Cards, paneles |
| `--color-ink` | `#f0ede8` | Texto principal |
| `--color-ink-muted` | `#8a8080` | Texto secundario |
| `--color-pendiente` | `#c8a96e` | Estado dorado (pendiente de subasta) |
| `--color-subastado` | `#5cba7a` | Estado verde (subastado) |

Clases CSS clave: `.btn-gold`, `.btn-danger`, `.btn-admin-edit`, `.link-gold`, `.link-back`, `.input-field`, `.card-lote`, `.animate-fadein`, `.stagger-1..6`

---

## Flujo de estados de un lote

```
pendiente → subastado
```

- `subastado` muestra ganador y precio final en la UI pública y en el detalle
- `pendiente` ("Pendiente de subasta") muestra "Este lote todavía no fue subastado."
- Los valores viejos `adjudicado` / `sin_adjudicar` se leen como `subastado` / `pendiente` (`toEstado` en `lib/lotes.ts`)

---

## Comandos útiles

```bash
cd Subastas
# Requiere Node 22+ (en esta Mac: PATH=/opt/homebrew/opt/node/bin:$PATH)
vercel env pull .env.local   # trae DATABASE_URL y BLOB_READ_WRITE_TOKEN
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run start    # servidor de producción
```

---

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `ADMIN_PASSWORD` | `subasta2024` | Contraseña del panel admin |
| `ADMIN_SECRET` | `change-this-secret-in-production` | Clave para firmar el token HMAC |

Crear un `.env.local` con valores seguros antes de poner en producción.

---

## Registro de trabajo (sesión 2026-10-01)

- Análisis completo del proyecto: stack, estructura, DB, auth, estilos y flujos
- Creación de este `CLAUDE.md` con documentación para futuras sesiones

## Registro de trabajo (sesión 2026-10-01, deploy)

- Migración de SQLite + disco a Neon Postgres + Vercel Blob para poder correr en Vercel
- `ADMIN_PASSWORD` y `ADMIN_SECRET` cargadas en Vercel (production, preview, development)

## Registro de trabajo (sesión 2026-10-06)

- Campo `precio_base` en lotes (form admin + lista admin; todavía no se muestra en la web pública)
- Soporte de videos en lugar de imágenes, con subida directa a Vercel Blob y `/api/upload` protegido
- Lógica de auth centralizada en `lib/auth.ts`
