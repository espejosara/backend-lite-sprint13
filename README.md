# backend-lite

Backend del e-commerce desarrollado con Express, Prisma y PostgreSQL. La API
cubre autenticación mediante cookies, catálogo, carrito, wishlist, reviews,
administración, imágenes en Cloudinary y pagos con Stripe Checkout.

## Tecnologías

- Node.js
- Express
- Prisma
- PostgreSQL o Supabase
- JWT almacenado en una cookie `HttpOnly`
- bcryptjs para proteger contraseñas
- Helmet para añadir cabeceras HTTP de seguridad
- Limitación de intentos en registro e inicio de sesión
- Cloudinary para imágenes
- Stripe Checkout y webhooks para pagos

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

Usa el archivo de ejemplo como plantilla y sustituye únicamente los valores:

```bash
cp .env.example .env
```

`JWT_SECRET`, las credenciales de Cloudinary y las claves de Stripe nunca deben
subirse al repositorio ni exponerse en variables `VITE_*` del frontend.

### Base de datos

Sincroniza el esquema y genera Prisma Client:

```bash
npx prisma db push
npx prisma generate
```

## CORS

El servidor acepta por defecto el frontend local en `http://localhost:5173`.

También admite:

- Orígenes locales con hostname `localhost`, `127.0.0.1` o `::1`.
- Orígenes exactos definidos mediante `FRONTEND_URL` o `ALLOWED_ORIGINS`.
- Peticiones sin cabecera `Origin`, como las realizadas por Postman o por herramientas de test.

CORS permite credenciales, los métodos `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
y `OPTIONS`, y la cabecera `Content-Type`. Un deploy preview debe añadirse de
forma explícita a `ALLOWED_ORIGINS`; no se aceptan comodines cuando viajan
cookies.

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
- Cookies `HttpOnly`, logout y restauración de sesión.
- Listado, creación, edición y eliminación de productos.
- Validaciones de los datos de producto.
- Actualización de cantidades, control de stock y propiedad del carrito.
- Eliminación completa de líneas del carrito.
- Creación segura de Stripe Checkout Sessions.
- Firma, idempotencia y transacción del webhook de Stripe.

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
test/
```

## API

### Autenticación

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/register` | Público |
| POST | `/auth/login` | Público |
| POST | `/auth/logout` | Público |
| GET | `/auth/me` | Usuario autenticado |

### Productos

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/products` | Público |
| GET | `/products/:id` | Público |
| POST | `/products` | Admin |
| PUT | `/products/:id` | Admin |
| DELETE | `/products/:id` | Admin |

Las operaciones `POST /products` y `PUT /products/:id` aceptan
`multipart/form-data`. El archivo debe enviarse en el campo `image`; se admiten
JPG, PNG, WebP, GIF y AVIF hasta 5 MB. La imagen es obligatoria al crear y
opcional al editar. El backend la sube a la carpeta `products` de Cloudinary y
guarda únicamente su `secure_url` en `imageUrl`.

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

### Pagos

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/payments/checkout-session` | Usuario autenticado |
| POST | `/payments/webhook` | Firma de Stripe |

Este endpoint obtiene el carrito de la base de datos, vuelve a validar el stock
y crea una Stripe Checkout Session con los precios guardados en el backend. El
cliente recibe `data.url` para redirigir al usuario a la página alojada por
Stripe. Crear la sesión no vacía el carrito ni crea todavía un pedido pagado.

Stripe confirma el pago enviando `checkout.session.completed` al webhook. Esa
ruta recibe el cuerpo sin parsear, verifica `stripe-signature` con
`STRIPE_WEBHOOK_SECRET` y solo entonces crea el pedido, descuenta el stock y
elimina del carrito los productos comprados dentro de una transacción. El campo
único `stripeCheckoutSessionId` evita procesar dos veces una misma sesión.

Después de actualizar el esquema, sincroniza Prisma y regenera el cliente:

```bash
npx prisma db push
npx prisma generate
```

Para reenviar webhooks durante el desarrollo:

```bash
stripe listen --forward-to localhost:3000/payments/webhook
```

Guarda el valor `whsec_...` mostrado por Stripe CLI en
`STRIPE_WEBHOOK_SECRET` dentro de `.env`.

## Autenticación

Al registrarse o iniciar sesión, la API guarda el JWT en una cookie `HttpOnly`.
El navegador debe enviar las peticiones con credenciales (`withCredentials: true`
en Axios). Las rutas protegidas leen el token desde esa cookie y el frontend no
necesita ni puede acceder al JWT.

En desarrollo la cookie usa `SameSite=Lax`; en producción usa
`SameSite=None; Secure` para admitir un frontend y una API alojados en dominios
HTTPS diferentes. `POST /auth/logout` elimina la cookie.

Como las cookies viajan con las peticiones, CORS solo admite localhost y los
orígenes exactos configurados en `FRONTEND_URL` o `ALLOWED_ORIGINS`. Los deploy
previews que deban acceder a la API se añaden explícitamente a esa lista.

### Seguridad de contraseñas

- Las contraseñas nuevas se guardan mediante `bcryptjs` con un factor de coste de 10.
- El login utiliza `bcrypt.compare()`; nunca compara contraseñas en texto plano.
- Tanto un usuario inexistente como una contraseña incorrecta devuelven el mismo error genérico: `Credenciales inválidas`.
- La contraseña y su hash no se incluyen en las respuestas de la API.
- El JWT no se incluye en el cuerpo de las respuestas de registro o login.

### Protecciones HTTP

- Helmet añade cabeceras de seguridad y Express no publica `X-Powered-By`.
- Registro e inicio de sesión limitan por defecto a 10 intentos fallidos cada
  15 minutos por dirección IP. Los valores pueden ajustarse mediante
  `AUTH_RATE_LIMIT_WINDOW_MS` y `AUTH_RATE_LIMIT_MAX`.
- Los errores internos no exponen detalles sensibles cuando
  `NODE_ENV=production`.
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
