# backend-lite

Backend final del proyecto desarrollado con Express, Prisma, PostgreSQL y JWT. La API está pensada para conectar con un frontend en React y cubrir autenticación, catálogo de productos, carrito, wishlist, reviews y rutas de administración.

## Tecnologías

- Node.js
- Express
- Prisma
- PostgreSQL o Supabase
- JWT para autenticación
- bcryptjs para proteger contraseñas
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

También se aceptan:

- Orígenes locales con hostname `localhost`, `127.0.0.1` o `::1`.
- Sitios y deploy previews servidos por HTTPS cuyo hostname termina exactamente en `.netlify.app`.
- Orígenes exactos definidos mediante `FRONTEND_URL` o `ALLOWED_ORIGINS`.
- Peticiones sin cabecera `Origin`, como las realizadas por Postman o por herramientas de test.

CORS permite credenciales, los métodos `GET`, `POST`, `PUT`, `PATCH`, `DELETE` y `OPTIONS`, y las cabeceras `Content-Type` y `Authorization`.

Para producción puedes usar una de estas opciones:

- Definir `FRONTEND_URL` con la URL del frontend desplegado.
- Definir `ALLOWED_ORIGINS` con varias URLs separadas por comas.
- Usar `ALLOW_ALL_ORIGINS=true` solo de forma temporal durante pruebas.

## Scripts

```bash
npm run dev
npm start
npm test
npm run test:watch
```

## Pruebas automatizadas

El backend utiliza el runner nativo `node:test`. Las pruebas unitarias inyectan una implementación simulada de Prisma, por lo que no escriben usuarios, productos ni carritos en la base de datos real.

La suite cubre:

- Registro con hash bcrypt y respuestas sin contraseña.
- Login correcto y error genérico para credenciales inválidas.
- Autenticación JWT y autorización por rol `admin`.
- Listado, creación, edición y eliminación de productos.
- Validaciones de los datos de producto.
- Actualización de cantidades, control de stock y propiedad del carrito.
- Eliminación completa de líneas del carrito.

Ejecutar una sola vez:

```bash
npm test
```

Ejecutar automáticamente al modificar archivos:

```bash
npm run test:watch
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
| GET | `/auth/me` | Usuario autenticado |

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
| PATCH | `/cart/items/:itemId` | Usuario autenticado |
| DELETE | `/cart/items/:itemId` | Usuario autenticado |
| POST | `/cart/checkout` | Usuario autenticado |
| GET | `/cart/all` | Admin |

### Wishlist

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/wishlist` | Usuario autenticado |
| POST | `/wishlist/:productId` | Usuario autenticado |

### Pedidos

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/orders` | Usuario autenticado |

## Autenticación

Las rutas protegidas requieren el header:

```bash
Authorization: Bearer <token>
```

El token se genera al iniciar sesión y contiene el id, email y role del usuario.

### Seguridad de contraseñas

- Las contraseñas nuevas se guardan mediante `bcryptjs` con un factor de coste de 10.
- El login utiliza `bcrypt.compare()`; nunca compara contraseñas en texto plano.
- Tanto un usuario inexistente como una contraseña incorrecta devuelven el mismo error genérico: `Credenciales inválidas`.
- La contraseña y su hash no se incluyen en las respuestas de la API.
- Las cuentas que existían antes de incorporar bcrypt fueron migradas en la base de datos actual. Si se importa otra base de datos antigua, sus contraseñas también deberán migrarse o restablecerse.

## Auditoría de dependencias

En la versión actual del lockfile, `npm audit` informa de cuatro avisos de severidad alta en esta cadena transitiva:

```text
prisma 6.16.2
└── @prisma/config 6.16.2
    ├── deepmerge-ts 7.1.5
    └── effect 3.16.12
```

Estos avisos proceden de las herramientas internas de configuración de Prisma y no de `bcryptjs` ni de la lógica de autenticación de la API. Prisma se mantiene en `devDependencies`.

No se debe ejecutar automáticamente:

```bash
npm audit fix --force
```

Actualmente ese comando propone un cambio incompatible de Prisma. Tampoco se debe actualizar el proyecto a una versión `release candidate` de Prisma únicamente para ocultar el aviso.

Para revisar el estado de las dependencias:

```bash
npm ls prisma @prisma/config deepmerge-ts effect
npm audit --omit=dev
```

La actualización debe realizarse cuando Prisma publique una versión estable compatible que incorpore `effect >= 3.20.0` y `deepmerge-ts >= 8.0.0`. Después de actualizar Prisma y `@prisma/client` a la misma versión, se deberá ejecutar `npx prisma generate`, validar el esquema y probar la API completa.

## Roles

El sistema maneja dos roles:

- `user` para uso normal de la aplicación.
- `admin` para administrar productos y ver todos los carritos.

## Despliegue en Render

1. Conectar el repositorio en Render.
2. Configurar el build command como `npm install`.
3. Configurar el start command como `npm start` o `node src/server.js`.
4. Añadir las variables de entorno del proyecto.

## Notas para la revisión

- El backend usa PostgreSQL porque el proyecto necesita relaciones entre usuarios, productos, carrito y wishlist.
- Prisma facilita la conexión con la base de datos y mantiene el código del proyecto más claro.
- CORS está configurado para desarrollo local y para el frontend desplegado.
- Las rutas administrativas están protegidas con `requireRole("admin")`.
