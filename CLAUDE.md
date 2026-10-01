@AGENTS.md

# Subastas Ludovica — Documentación del proyecto

## Stack tecnológico

- **Framework**: Next.js 16.3.6 (App Router, React 19)
- **Base de datos**: SQLite vía `better-sqlite3` (archivo en `data/subasta.db`)
- **Estilos**: Tailwind CSS v4 + clases CSS personalizadas en `globals.css`
- **Fuentes**: Playfair Display (serif, elegante) + Inter (sans-serif, UI)
- **Tipado**: TypeScript 5
- **Imágenes**: `next/image` con `unoptimized: true` en `next.config.ts`

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
    upload/route.ts       → POST: sube imagen a public/uploads/
    img/[filename]/route.ts → GET: sirve imágenes desde public/uploads/
    auth/
      login/route.ts      → POST: valida contraseña, setea cookie HMAC
      logout/route.ts     → POST: borra cookie admin_token
lib/
  db.ts                   → Singleton de conexión SQLite, crea tabla lotes
  lotes.ts                → CRUD, tipos, formatPrecio, ESTADO_CONFIG
proxy.ts                  → Middleware de auth para rutas /admin/*
```

---

## Base de datos — tabla `lotes`

| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| numero_lote | TEXT NOT NULL | Ordena como entero si es posible |
| nombre | TEXT NOT NULL | |
| descripcion | TEXT | Default '' |
| imagen | TEXT | Ruta `/api/img/<uuid>.<ext>` |
| estado | TEXT | `adjudicado` / `subastado` / `sin_adjudicar` |
| ganador | TEXT | Nombre del ganador |
| precio_final | REAL | 0 si no adjudicado |
| created_at | TEXT | datetime localtime |
| updated_at | TEXT | datetime localtime |

El singleton de DB usa WAL mode para mejor concurrencia.

---

## Autenticación admin

- Contraseña comparada directamente contra `ADMIN_PASSWORD` (env var, default `subasta2024`)
- Token = HMAC-SHA256(password, ADMIN_SECRET), almacenado en cookie `admin_token` (httpOnly, 7 días)
- El middleware `proxy.ts` protege todas las rutas `/admin/*` excepto `/admin/login`
- **Importante**: en producción hay que setear `ADMIN_PASSWORD` y `ADMIN_SECRET` como variables de entorno seguras

---

## Imágenes

- Se suben vía `POST /api/upload` → se guardan en `public/uploads/<uuid>.<ext>`
- Se sirven vía `GET /api/img/<filename>` con `Cache-Control: immutable, 1 año`
- La ruta usa `path.basename()` para evitar path traversal

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
| `--color-adjudicado` | `#5cba7a` | Estado verde |
| `--color-subastado` | `#6ba3c8` | Estado azul |
| `--color-sin-adjudicar` | `#7a7878` | Estado gris |

Clases CSS clave: `.btn-gold`, `.btn-danger`, `.btn-admin-edit`, `.link-gold`, `.link-back`, `.input-field`, `.card-lote`, `.animate-fadein`, `.stagger-1..6`

---

## Flujo de estados de un lote

```
sin_adjudicar → subastado → adjudicado
```

- `adjudicado` y `subastado` muestran ganador y precio final en la UI pública y en el detalle
- `sin_adjudicar` muestra "Este lote no fue adjudicado."

---

## Comandos útiles

```bash
cd Subastas
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
