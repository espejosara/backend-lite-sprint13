# backend-lite

Backend final del proyecto desarrollado con Express, Prisma, PostgreSQL y JWT. La API está pensada para conectar con un frontend en React y cubrir autenticación, catálogo de productos, carrito, wishlist, reviews y rutas de administración.

## Tecnologías

- Node.js
- Express
- Prisma
- PostgreSQL o Supabase
- JWT para autenticación
- CORS para integración con frontend local y desplegado

## Requisitos

- Node.js 18 o superior
- PostgreSQL 12 o Supabase
- npm

## Instalación

```bash
npm install
```

## Configuración

### Variables de entorno

Crear un archivo `.env` con esta estructura:

```bash
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
DIRECT_URL=postgresql://user:password@host:5432/dbname
JWT_EXPIRES_IN=24h
JWT_SECRET=tu_clave_secreta
FRONTEND_URL=https://tu-frontend.com
ALLOWED_ORIGINS=http://localhost:5173,https://tu-frontend.com
ALLOW_ALL_ORIGINS=false
```

### Base de datos

Ejecutar el archivo `supabase/setup.sql` en Supabase o en tu gestor SQL local para crear las tablas y relaciones necesarias.

Si usas PostgreSQL local:

```bash
psql -U postgres -d tu_db -f supabase/setup.sql
```

## CORS

El servidor acepta por defecto el frontend local en `http://localhost:5173`.

Para producción puedes usar una de estas opciones:

- Definir `FRONTEND_URL` con la URL del frontend desplegado.
- Definir `ALLOWED_ORIGINS` con varias URLs separadas por comas.
- Usar `ALLOW_ALL_ORIGINS=true` solo de forma temporal durante pruebas.

## Scripts

```bash
npm run dev
npm start
```

## Ejecución

```bash
npm run dev
```

Servidor disponible en `http://localhost:3000`.

## Estructura del proyecto

```text
src/
  app.js
  server.js
  controllers/
  services/
  routes/
  middlewares/
  lib/
prisma/
supabase/
```

## API

### Autenticación

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/register` | Público |
| POST | `/auth/login` | Público |

### Productos

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/products` | Público |
| GET | `/products/:id` | Público |
| POST | `/products` | Admin |
| PUT | `/products/:id` | Admin |
| DELETE | `/products/:id` | Admin |

### Reviews

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/products/:id/reviews` | Público |
| POST | `/products/:id/reviews` | Usuario autenticado |

### Carrito

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/cart` | Usuario autenticado |
| POST | `/cart/items` | Usuario autenticado |
| DELETE | `/cart/items/:itemId` | Usuario autenticado |
| POST | `/cart/checkout` | Usuario autenticado |
| GET | `/cart/all` | Admin |

### Wishlist

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/wishlist` | Usuario autenticado |
| POST | `/wishlist/:productId` | Usuario autenticado |

## Autenticación

Las rutas protegidas requieren el header:

```bash
Authorization: Bearer <token>
```

El token se genera al iniciar sesión y contiene el id, email y role del usuario.

## Roles

El sistema maneja dos roles:

- `user` para uso normal de la aplicación.
- `admin` para administrar productos y ver todos los carritos.

## Despliegue en Render

1. Conectar el repositorio en Render.
2. Configurar el build command como `npm install`.
3. Configurar el start command como `node src/server.js`.
4. Añadir las variables de entorno del proyecto.

## Notas para la revisión

- El backend usa PostgreSQL porque el proyecto necesita relaciones entre usuarios, productos, carrito y wishlist.
- Prisma facilita la conexión con la base de datos y mantiene el código del proyecto más claro.
- CORS está configurado para desarrollo local y para el frontend desplegado.
- Las rutas administrativas están protegidas con `requireRole("admin")`.
