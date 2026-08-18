# backend-lite

Backend en Express + Prisma para conectar con un frontend React + Vite. Incluye autenticación JWT, carrito y wishlist con persistencia en PostgreSQL.

## Requisitos

- Node.js 18+
- PostgreSQL 12+ (o Supabase)
- npm o yarn

## Instalación rápida

```bash
npm install
```

## Configuración

### 1. Variables de entorno (`.env`)

```bash
PORT=3000
JWT_EXPIRES_IN=24h
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
DIRECT_URL=postgresql://user:password@host:5432/dbname
```

**Con Supabase:** Copia las URLs directamente del dashboard de Supabase.

### 2. Setup de base de datos

Si usas Supabase, ejecuta el SQL en `supabase/setup.sql` en el editor SQL del dashboard.

Si usas PostgreSQL local, ejecuta:

```bash
psql -U postgres -d tu_db -f supabase/setup.sql
```

## Ejecución

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

Servidor en `http://localhost:3000`

## Estructura de carpetas

```
src/
├── app.js              # Configuración de Express
├── server.js           # Punto de entrada
├── controllers/        # Handlers HTTP
├── services/           # Lógica de negocio
├── routes/             # Definición de rutas
├── middlewares/        # Auth, error handling
└── lib/
    ├── prisma.js       # Cliente Prisma
    └── jwt.js          # Utilidades JWT
```

## Endpoints

### 🔐 Auth (Público)

| Método | Endpoint | Descripción |
|--------|----------|------------|
| POST | `/auth/register` | Registrar usuario nuevo |
| POST | `/auth/login` | Login y obtener JWT |

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 📦 Productos (Público)

| Método | Endpoint | Descripción |
|--------|----------|------------|
| GET | `/products` | Listar todos |
| GET | `/products/:id` | Obtener uno |

### ⭐ Reviews (Requiere JWT)

| Método | Endpoint | Descripción |
|--------|----------|------------|
| GET | `/products/:id/reviews` | Obtener reviews del producto |
| POST | `/products/:id/reviews` | Crear review |

**Header requerido:**
```
Authorization: Bearer <jwt_token>
```

### 🛒 Carrito (Requiere JWT)

**GET /cart**
- Lista los items en el carrito del usuario autenticado
- Response: Array de CartItem con datos del producto incluidos

**POST /cart/items**
- Agrega o incrementa cantidad de un producto
- Body:
```json
{
  "productId": 1,
  "quantity": 2
}
```
- Valida stock disponible

**DELETE /cart/items/:itemId**
- Elimina un item del carrito

**POST /cart/checkout**
- Finaliza compra y vacía el carrito
- Response: Items comprados

### 💚 Wishlist (Requiere JWT) - Toggle Pattern

**GET /wishlist**
- Lista productos agregados a wishlist

**POST /wishlist/:productId**
- **Toggle:** Agrega si no existe, elimina si ya existe
- Response:
```json
{
  "ok": true,
  "data": {
    "removed": false  // true si fue eliminado, false si fue agregado
  }
}
```

Este patrón es más eficiente que tener POST (agregar) y DELETE (eliminar) separados.

## Validaciones

### Cart
- ✓ Cantidad debe ser entero > 0
- ✓ Producto debe existir
- ✓ Stock disponible debe ser >= cantidad solicitada
- ✓ No duplicados: mismo usuario + producto incrementa cantidad

### Wishlist
- ✓ Producto debe existir
- ✓ No duplicados: mismo usuario + producto no puede existir dos veces
- ✓ Toggle automático: POST agrega o elimina según estado

## Autenticación

El servidor usa JWT (JSON Web Tokens) con algoritmo HS256.

**Flujo:**
1. Usuario se registra o loguea
2. Recibe JWT en response
3. Incluye JWT en header `Authorization: Bearer <token>` para rutas protegidas

**Token dura:** 24 horas (configurable en `.env` con `JWT_EXPIRES_IN`)

## Deployment en Render

### 1. Preparar repositorio

```bash
git add .
git commit -m "refactor: cleanup código y actualizar documentación"
git push
```

### 2. Crear Web Service en Render

1. Ve a [render.com](https://render.com)
2. New → Web Service
3. Conecta tu repo GitHub
4. Configuración:
   - **Build command:** `npm install`
   - **Start command:** `node src/server.js`

### 3. Environment Variables

En Render, añade:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_EXPIRES_IN=24h
JWT_SECRET=<algo-seguro>
```

### 4. Deploy

Render hace deploy automático con cada push a main.

## Notas

- **BD:** PostgreSQL elegido por relaciones estructuradas (CartItem → Product → User)
- **Reviews:** Aunque podrían ir en NoSQL, estructura fija las hace perfectas para SQL
- **Prisma:** ORM moderno con soporte excelente para PostgreSQL
- **Persistencia:** Cart y Wishlist usan BD, no memoria local


#### Contrato estable de Wishlist

- Path base único: `/wishlist`
- Quitar favorito: `DELETE /wishlist/:productId`
- Mismo JSON de éxito en `GET/POST/DELETE`:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "El Samurai Futurista",
      "description": "Guerrero con armadura...",
      "price": 49.99,
      "imageUrl": "https://..."
    }
  ]
}
```

- Códigos HTTP:
- `200` éxito (GET/POST/DELETE)
- `401` no autenticado/token inválido
- `404` recurso no encontrado (ruta, producto inexistente o producto no presente en favoritos)

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
