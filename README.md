# backend-lite

Backend simple en Express + Prisma para conectar con un frontend React + Vite.

## Requisitos

- Node.js 18 o superior
- Base de datos PostgreSQL / Supabase
- Variables de entorno configuradas en `.env`

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz con algo parecido a esto:

```bash
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/DB
JWT_EXPIRES_IN=24h
```

## Ejecución

Modo desarrollo:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

El servidor arranca en:

```bash
http://localhost:3000
```

## Estructura

- `src/server.js`: arranque del servidor
- `src/app.js`: configuración de Express y rutas
- `src/routes/`: definición de endpoints
- `src/controllers/`: capa HTTP
- `src/services/`: lógica de negocio y acceso a datos
- `src/lib/`: cliente Prisma y helpers
- `src/middlewares/`: autenticación y manejo de errores
- `supabase/setup.sql`: script para crear y poblar tablas

## Endpoints

### Health check

- `GET /`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Products

- `GET /products`
- `GET /products/:id`

### Reviews

- `GET /products/:id/reviews`
- `POST /products/:id/reviews`  
  Requiere header `Authorization: Bearer <token>`

### Cart

- `GET /cart`  
  Requiere token JWT
- `POST /cart/items`  
  Requiere token JWT
- `DELETE /cart/items/:itemId`  
  Requiere token JWT
- `POST /cart/checkout`  
  Requiere token JWT

### Wishlist

- `GET /wishlist`  
  Requiere token JWT
- `POST /wishlist/:productId`  
  Requiere token JWT

## Ejemplo de uso

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mail.com","password":"123456"}'
```

### Crear review

```bash
curl -X POST http://localhost:3000/products/3/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"rating":5,"comment":"Muy buena figura"}'
```

## Notas

- Las rutas de `cart` y `wishlist` están protegidas con JWT.
- `POST /products/:id/reviews` también requiere autenticación.
- Si usas Supabase con inserts manuales, puede que tengas que reajustar secuencias de IDs.
