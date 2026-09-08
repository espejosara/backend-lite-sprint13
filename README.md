# NeoKensei Chronicles · Backend

Proyecto final de **Full Stack Developer + IA · Módulo 3**. API de la tienda de figuras y coleccionables NeoKensei Chronicles, desarrollada con **Node.js, Express, Prisma y PostgreSQL**.

El backend gestiona autenticación por cookies, autorización por rol, catálogo, carrito, favoritos, reseñas, pedidos y recomendaciones. Integra Cloudinary para almacenar imágenes y Stripe Checkout para procesar pagos y confirmar pedidos mediante webhooks.

## Acceso al proyecto

| Recurso | Enlace |
| --- | --- |
| Tienda en Netlify | [neokenseichronicles.netlify.app](https://neokenseichronicles.netlify.app) |
| API en Render | [backend-lite-sprint13.onrender.com](https://backend-lite-sprint13.onrender.com) |
| Estado de API y PostgreSQL | [GET /health](https://backend-lite-sprint13.onrender.com/health) |
| Repositorio backend | [espejosara/backend-lite-sprint13](https://github.com/espejosara/backend-lite-sprint13) |
| Repositorio y documentación frontend | [espejosara/clase13project](https://github.com/espejosara/clase13project) |

**Nota para la evaluación:** el backend utiliza el plan gratuito de Render. Tras 15 minutos sin tráfico puede suspenderse; al recibir una petición vuelve a arrancar, lo que puede tardar aproximadamente un minuto. Espera antes de reintentar el login o el catálogo. El tiempo es orientativo, no una garantía de respuesta. [Documentación de Render](https://render.com/docs/free#spinning-down-on-idle).

## Contenido

- [Credenciales de prueba para evaluación](#credenciales-de-prueba-para-evaluación)
- [Objetivos y funcionalidades](#objetivos-y-funcionalidades)
- [Arquitectura y modelo de datos](#arquitectura-y-modelo-de-datos)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Variables de entorno](#variables-de-entorno)
- [Autenticación, roles y seguridad](#autenticación-roles-y-seguridad)
- [Referencia de la API](#referencia-de-la-api)
- [Imágenes con Multer y Cloudinary](#imágenes-con-multer-y-cloudinary)
- [Pagos y confirmación con Stripe](#pagos-y-confirmación-con-stripe)
- [Pruebas y scripts](#pruebas-y-scripts)
- [Despliegue en Render](#despliegue-en-render)
- [Estado de dependencias](#estado-de-dependencias)
- [Resolución de problemas](#resolución-de-problemas)
- [Mejoras futuras](#mejoras-futuras)
- [Limitaciones actuales](#limitaciones-actuales)
- [Decisiones técnicas](#decisiones-técnicas)

## Credenciales de prueba para evaluación

Cuentas facilitadas para revisar la aplicación desplegada desde el frontend:

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `sara@hotmail.com` | `123456` |
| Usuario estándar | `saratest@mail.com` | `mR6KBdjpa6TTKSF` |

**ADMIN** tiene acceso a `/admin`, alta y edición de productos, subida de imágenes y eliminación de productos sin pedidos asociados. **USER** puede gestionar su carrito, favoritos, reseñas y compras. Los valores almacenados por la API son `admin` y `user`, en minúsculas.

Las cuentas pertenecen al entorno de evaluación. No se generan automáticamente al clonar el repositorio ni al ejecutar Prisma sobre una base de datos vacía.

### Tarjeta de Stripe para evaluación

| Campo | Valor |
| --- | --- |
| Número | `4242 4242 4242 4242` |
| Caducidad | Cualquier fecha futura |
| CVC | `123` |

Usa el entorno de prueba de Stripe y una clave `sk_test_...`; no introduzcas tarjetas reales. La simulación no mueve dinero. [Documentación de pruebas de Stripe](https://docs.stripe.com/testing#testing-interactively).

## Objetivos y funcionalidades

| Área | Implementación |
| --- | --- |
| Autenticación | Registro y login con bcrypt, JWT en cookie HttpOnly, perfil y logout. |
| Roles | Middleware de autenticación y `requireRole("admin")` para las operaciones administrativas. |
| Catálogo | Listado, detalle, creación, edición, eliminación y productos destacados. |
| Imágenes | Recepción multipart con Multer, subida a Cloudinary y persistencia de URL segura. |
| Compra | Carrito por usuario, cantidades limitadas por stock, Stripe Checkout y pedidos confirmados. |
| Personalización | Wishlist, reseñas y recomendaciones por afinidad de categorías. |
| Calidad | Validaciones, errores centralizados, códigos HTTP, pruebas y validación de esquema en CI. |
| Despliegue | Blueprint de Render, health check, variables privadas y CORS para el frontend. |

## Arquitectura y modelo de datos

**Tecnologías:** Express 5, Prisma 6, PostgreSQL, JWT, bcryptjs, cookie-parser, cors, Helmet, express-rate-limit, Multer, Cloudinary y Stripe. Se utiliza JavaScript con módulos ES y el runner nativo `node:test`.

```mermaid
flowchart LR
    Frontend[React en Netlify] --> Proxy[Proxy /api]
    Proxy --> Routes[Rutas Express]
    Routes --> Middleware[Autenticación y roles]
    Middleware --> Controllers[Controladores y validación]
    Controllers --> Services[Servicios]
    Services --> DB[Prisma y PostgreSQL]
    Services --> Cloudinary[Cloudinary]
    Services --> Stripe[Stripe Checkout]
    Stripe --> Webhook[Webhook con firma]
    Webhook --> Services
```

Las rutas definen el contrato HTTP y sus permisos. Los controladores validan la petición y construyen la respuesta. Los servicios concentran operaciones de negocio y acceso a datos. Los fallos se propagan al middleware de errores cuando corresponde, evitando repetir el tratamiento de errores internos.

```text
src/
  app.js          Orden de middleware y registro de rutas
  server.js       Arranque, validación de entorno y cierre del servidor
  config/         Cookies, CORS, Cloudinary, límites y entorno
  routes/         Endpoints y permisos
  controllers/    Validaciones y respuestas HTTP
  services/       Lógica de negocio e integraciones
  middlewares/    Autenticación, roles, Multer y errores
  lib/            Clientes Prisma/Stripe, JWT y validaciones comunes
prisma/
  schema.prisma   Modelo relacional
scripts/          Utilidades auxiliares
test/            Pruebas automatizadas
.github/          Workflow de integración continua
render.yaml       Configuración declarativa del despliegue
```

El esquema completo está en [prisma/schema.prisma](./prisma/schema.prisma):

| Entidad | Responsabilidad y relaciones |
| --- | --- |
| `User` | Identidad, hash de contraseña y rol; propietario de carrito, wishlist, reseñas y pedidos. |
| `Product` | Nombre, categoría, descripción, precio decimal, stock, URL de imagen y destacado. |
| `CartItem` | Producto y cantidad de un usuario; pareja usuario/producto única. |
| `WishlistItem` | Favorito de un usuario; pareja usuario/producto única. |
| `Review` | Reseña asociada a producto y, cuando existe, usuario. |
| `Order` | Compra del usuario, total, fecha de pago y sesión de Stripe única. |
| `OrderItem` | Producto, cantidad y precio unitario guardado en el momento de la compra. |

Los precios del pedido se conservan aunque después cambie el precio del catálogo. La relación de `OrderItem` impide borrar un producto comprado; la API responde con conflicto. El proyecto utiliza sincronización mediante `prisma db push`; no incluye un historial de migraciones ni un seed automático.

## Instalación y ejecución local

### Requisitos

- **Node.js 22**, usando `22.22.2` o superior de esa rama si se trabaja también con el frontend. Verificación realizada con `22.22.3`.
- npm y Git.
- Una base de datos PostgreSQL preparada para el proyecto, local o alojada, por ejemplo en Supabase.
- Cuenta Cloudinary para imágenes y entorno de prueba Stripe para pagos.
- Stripe CLI si se quieren recibir webhooks en local.

### Preparar la API

```bash
git clone https://github.com/espejosara/backend-lite-sprint13.git backend
cd backend
npm ci
cp .env.example .env
```

Completa `.env` según la tabla siguiente. Después, sobre la base de datos destinada al proyecto:

```bash
npm run prisma:generate
npm run prisma:push
npm run dev
```

`prisma:push` sincroniza las tablas con el esquema; no inserta productos ni usuarios. La API queda disponible en `http://localhost:3000`.

```bash
curl http://localhost:3000/health
```

`/health` verifica también PostgreSQL: devuelve `200` cuando la consulta de disponibilidad funciona y `503` cuando la base de datos no está disponible.

### Preparar el frontend y usuarios locales

En otra terminal, clona [el frontend](https://github.com/espejosara/clase13project) y sigue su README. Su configuración local apunta a `http://localhost:3000` y Vite se ejecuta en `http://localhost:5173`.

Para una base de datos vacía:

1. Registra un usuario desde `/register`. El servidor crea cuentas con rol `user` y guarda el hash de contraseña.
2. Para disponer de un administrador local, modifica el campo `role` de esa cuenta a `admin` desde una herramienta de administración de tu base de datos.
3. Cierra sesión y vuelve a entrar para que el JWT recoja el nuevo rol.
4. Crea los productos desde `/admin/products/new` con imágenes y stock.

La API no ofrece un endpoint público para conceder permisos administrativos. Las dos capas se entregan en repositorios independientes, con enlaces cruzados y configuración propia.

## Variables de entorno

Usa [.env.example](./.env.example) como plantilla. La columna de ejemplo indica la configuración local propuesta; no implica que todas las variables tengan ese valor por defecto en el código.

| Variable | Ejemplo local | Finalidad |
| --- | --- | --- |
| `NODE_ENV` | `development` | En Render debe ser `production`. |
| `PORT` | `3000` | Puerto HTTP; Render proporciona el suyo. |
| `DATABASE_URL` | `postgresql://user:password@host:5432/database?schema=public` | Conexión de Prisma a PostgreSQL. |
| `DIRECT_URL` | `postgresql://user:password@host:5432/database` | Conexión directa para operaciones del esquema; puede coincidir con la anterior en local. |
| `JWT_SECRET` | Valor aleatorio privado | Firma del JWT; mínimo 32 caracteres en producción. |
| `JWT_EXPIRES_IN` | `24h` | Duración del token. |
| `AUTH_COOKIE_NAME` | `authToken` | Nombre de la cookie de sesión. |
| `AUTH_COOKIE_MAX_AGE_MS` | `86400000` | Duración de la cookie en milisegundos; mantenerla coherente con la del JWT. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` | Ventana del límite de intentos de autenticación. |
| `AUTH_RATE_LIMIT_MAX` | `10` | Máximo de intentos fallidos por IP dentro de la ventana. |
| `FRONTEND_URL` | `http://localhost:5173` | Origen del frontend y destino de retorno de Stripe. En Render, URL HTTPS de Netlify. |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Orígenes adicionales permitidos, separados por comas. |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud | Cuenta de almacenamiento de imágenes. |
| `CLOUDINARY_API_KEY` | Clave de Cloudinary | Autenticación del servicio de imágenes. |
| `CLOUDINARY_API_SECRET` | Secreto de Cloudinary | Firma de las operaciones privadas. |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Clave privada del entorno de prueba. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Verificación del webhook; el secreto local de CLI y el de Render son distintos. |
| `STRIPE_CURRENCY` | `eur` | Moneda de la compra; la entrega trabaja con euros y conversión a céntimos. |

`CLIENT_URL` se admite como alias de `FRONTEND_URL` por compatibilidad. Para nuevas configuraciones utiliza `FRONTEND_URL`.

En producción, [validateEnvironment](./src/config/environment.js) comprueba la presencia de las variables privadas requeridas, los protocolos de las URLs y la longitud del secreto JWT. Esta comprobación no autentica las claves ante Stripe o Cloudinary ni sustituye `/health` para verificar PostgreSQL.

[.gitignore](./.gitignore) excluye `.env` y todas las variantes `.env.*`, salvo `.env.example`. Los secretos de API y base de datos no deben incluirse en Git ni en variables `VITE_*` del frontend.

## Autenticación, roles y seguridad

- Registro y login guardan el JWT en una cookie **HttpOnly**, sin devolverlo en el cuerpo JSON. El middleware lo lee desde `req.cookies`; no utiliza `Authorization: Bearer`.
- El frontend envía `withCredentials: true` y restaura la sesión mediante `GET /auth/me`.
- La cookie utiliza `SameSite=Lax` en desarrollo y `SameSite=None; Secure` en producción; el path es `/`. Logout la elimina con los atributos correspondientes.
- Las contraseñas se guardan con bcrypt y coste 10. Registro exige al menos 6 caracteres; email inexistente y contraseña incorrecta producen el mismo error de login.
- Las mutaciones administrativas requieren `requireRole("admin")`. Carrito, pedidos y favoritos se consultan para el usuario del JWT.
- Helmet añade cabeceras HTTP y se desactiva `X-Powered-By`. Login y registro limitan por defecto a 10 intentos fallidos cada 15 minutos por IP.
- Los errores internos no exponen sus detalles en producción.

### CORS y proxy

CORS permite credenciales y los orígenes exactos de `FRONTEND_URL`, `CLIENT_URL` y `ALLOWED_ORIGINS`. Fuera de producción admite también los orígenes locales; en producción deben configurarse explícitamente. Las peticiones sin `Origin`, como algunas herramientas de API, se admiten y siguen sujetas a la autenticación de cada ruta.

Se permiten `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` y la cabecera `Content-Type`. Los previews de despliegue requieren añadir su origen; no se utiliza un comodín para autorizar cookies.

El frontend desplegado solicita `/api` en Netlify, que actúa como proxy hacia Render. CORS regula el acceso del navegador; la autorización de operaciones se aplica además en el middleware y los servicios.

## Referencia de la API

Base local: `http://localhost:3000`. Base desplegada: `https://backend-lite-sprint13.onrender.com`. El prefijo `/api` corresponde al proxy del frontend, no a las rutas internas de Express.

| Método | Ruta | Acceso | Función |
| --- | --- | --- | --- |
| GET | `/` | Público | Identificación de la API. |
| GET | `/health` | Público | Estado de API y PostgreSQL. |
| POST | `/auth/register` | Público | Crear cuenta y cookie de sesión. |
| POST | `/auth/login` | Público | Iniciar sesión. |
| POST | `/auth/logout` | Público | Eliminar la cookie. |
| GET | `/auth/me` | Sesión | Perfil del usuario autenticado. |
| GET | `/products` | Público | Listar productos. |
| GET | `/products/recommendations` | Sesión | Recomendaciones del usuario. |
| GET | `/products/:id` | Público | Consultar producto. |
| POST | `/products` | ADMIN | Crear producto con imagen. |
| PUT | `/products/:id` | ADMIN | Editar campos o sustituir imagen. |
| DELETE | `/products/:id` | ADMIN | Eliminar producto sin pedidos asociados. |
| GET | `/products/:id/reviews` | Público | Listar reseñas. |
| POST | `/products/:id/reviews` | Sesión | Publicar reseña. |
| GET | `/cart` | Sesión | Carrito propio. |
| GET | `/cart/all` | ADMIN | Consultar todos los carritos. |
| POST | `/cart/items` | Sesión | Añadir producto o incrementar cantidad. |
| PATCH | `/cart/items/:itemId` | Sesión | Fijar cantidad de una línea propia. |
| DELETE | `/cart/items/:itemId` | Sesión | Eliminar una línea propia. |
| GET | `/wishlist` | Sesión | Listar favoritos propios. |
| POST | `/wishlist/:productId` | Sesión | Alternar favorito: añadir o retirar. |
| GET | `/orders` | Sesión | Historial de pedidos propios. |
| POST | `/payments/checkout-session` | Sesión | Crear sesión de pago. |
| GET | `/payments/checkout-session/:sessionId/order` | Sesión | Consultar confirmación de compra propia. |
| POST | `/payments/webhook` | Firma Stripe | Procesar confirmación de pago. |

### Cuerpos de petición y validaciones

| Operación | Datos esperados |
| --- | --- |
| Registro | JSON: `name`, `email`, `password`. |
| Login | JSON: `email`, `password`. |
| Alta de producto | Multipart: `name`, `category`, `description`, `price`, `stock`, `image`; `isFeatured` opcional. |
| Edición de producto | Campos a modificar; permite conservar la imagen anterior. |
| Añadir al carrito | JSON con `productId` y `quantity`. |
| Actualizar cantidad | JSON con `quantity`, entero positivo y dentro del stock. |
| Reseña | JSON con `rating` y `comment`; identidad obtenida de la sesión. |
| Crear Checkout Session | No necesita precios del cliente; usa el carrito guardado en PostgreSQL. |

Los identificadores se validan como enteros positivos. En productos se exige nombre, categoría, descripción, precio positivo y stock entero no negativo. `isFeatured` acepta booleanos o sus representaciones multipart `true`/`false`.

Las respuestas ordinarias siguen el formato `{ "success": true, "data": ... }`; los errores usan `{ "success": false, "error": "mensaje" }`. El webhook devuelve su confirmación específica `{ "received": true, "processed": ... }`.

| Código | Significado en la API |
| --- | --- |
| `200` | Consulta u operación completada. |
| `201` | Recurso o sesión de checkout creados. |
| `202` | Pedido aún pendiente de confirmación. |
| `400` | Datos inválidos, carrito vacío, stock insuficiente al crear checkout o firma Stripe inválida. |
| `401` | Sesión ausente, inválida o caducada. |
| `403` | Rol insuficiente u origen no permitido por CORS. |
| `404` | Ruta o recurso inexistente. |
| `409` | Conflicto: duplicados, referencias existentes o stock insuficiente al confirmar un pago. |
| `429` | Límite de intentos de autenticación. |
| `500` | Error interno del servidor. |
| `502` / `503` | Fallo de integración o servicio no disponible, según la operación. |

## Imágenes con Multer y Cloudinary

1. La ruta administrativa comprueba cookie y rol antes de procesar el archivo.
2. Multer recibe **un archivo** en el campo `image` y lo conserva temporalmente en memoria.
3. Se admiten JPG, PNG, WebP, GIF y AVIF, con un máximo de **5 MB**. La imagen es obligatoria al crear y opcional al editar.
4. El servicio sube el buffer a la carpeta `products` de Cloudinary y guarda `secure_url` como `imageUrl` en PostgreSQL.
5. Si falla la escritura en base de datos, intenta retirar la imagen recién subida. Al sustituir o eliminar un producto, también intenta limpiar el recurso anterior de Cloudinary.

Las imágenes no dependen del disco de Render. El frontend incorpora una imagen local de respaldo si la URL falla. El campo `isFeatured` permite seleccionar los productos de portada; por defecto es falso.

## Pagos y confirmación con Stripe

### Flujo de compra

1. `POST /payments/checkout-session` lee el carrito del usuario, comprueba cantidades y stock y calcula los precios desde PostgreSQL.
2. Crea una sesión con moneda EUR, importe en céntimos, referencia de usuario y metadatos de productos. Admite hasta 100 líneas diferentes.
3. Devuelve `sessionId` y `url`. Crear la sesión no crea el pedido ni vacía el carrito.
4. Stripe comunica el resultado al webhook. La ruta utiliza el cuerpo original mediante `express.raw` antes de `express.json` y verifica `stripe-signature` con el secreto del webhook.
5. Se procesan `checkout.session.completed` y `checkout.session.async_payment_succeeded`, comprobando el estado de pago. Los eventos no pertinentes se ignoran.
6. El servicio obtiene los datos de Stripe, verifica el total y ejecuta una transacción: descuenta stock, crea pedido y líneas y retira del carrito las unidades compradas. Si existen unidades adicionales, las conserva.
7. La sesión única y las comprobaciones de idempotencia evitan crear dos pedidos al recibir el mismo evento más de una vez.
8. El frontend consulta la confirmación: recibe `202` con `confirmed: false` mientras no existe el pedido, o `200` con el pedido confirmado. La consulta se limita al usuario autenticado y desactiva caché.

El retorno del navegador no valida el pago. La creación del pedido depende de la confirmación verificada por el backend.

### Webhooks en local

Con Stripe CLI instalado y vinculado a tu entorno de prueba:

```bash
stripe login
stripe listen --forward-to localhost:3000/payments/webhook
```

Copia el secreto `whsec_...` mostrado por ese proceso a `STRIPE_WEBHOOK_SECRET`, reinicia el backend y mantén la escucha abierta mientras realizas una compra desde el frontend local. `FRONTEND_URL` debe ser `http://localhost:5173`.

## Pruebas y scripts

| Comando | Función |
| --- | --- |
| `npm run dev` | Arranca `src/server.js`; actualmente no incluye recarga automática. |
| `npm start` | Mismo punto de entrada para despliegue. |
| `npm test` | Ejecuta las pruebas con `node --test`. |
| `npm run test:watch` | Ejecuta pruebas al modificar archivos. |
| `npm run prisma:generate` | Genera Prisma Client. |
| `npm run prisma:push` | Sincroniza el esquema con la base configurada. |
| `npm run check` | Ejecuta pruebas y valida el esquema Prisma. |
| `npm run verify:cloudinary` | Utilidad auxiliar heredada, pendiente de adaptar a cookies; no forma parte de la comprobación de entrega. |

**Verificación local del 8 de septiembre de 2026:** **100 pruebas correctas** con `npm test` y esquema correcto con `prisma validate`, las dos comprobaciones incluidas en `npm run check`.

Las pruebas cubren autenticación, roles, cookies, CORS, validaciones, errores, productos, carrito y stock, recomendaciones, Cloudinary y Stripe. La suite utiliza dependencias simuladas para evitar escribir usuarios, productos y pedidos en la base real. La validación de Prisma comprueba el esquema; no confirma la conexión ni aplica tablas.

El script auxiliar [verify-cloudinary.js](./scripts/verify-cloudinary.js) todavía envía `Authorization: Bearer`, incompatible con el middleware actual de cookies. Para evaluar la integración real utiliza el formulario ADMIN. Ese script requiere adaptación antes de utilizarse y, una vez corregido, trabajará con un producto e imagen temporales en servicios reales.

[GitHub Actions](./.github/workflows/ci.yml) instala dependencias, genera Prisma Client, valida el esquema y ejecuta las pruebas en pull requests y push a `main`. Este backend no tiene un script de lint ni una fase de compilación; el frontend sí ejecuta lint y build.

## Despliegue en Render

[render.yaml](./render.yaml) declara servicio Node en plan gratuito, versión 22, build, arranque, health check y variables privadas sin valores secretos.

1. Crear un Blueprint en Render conectado a este repositorio.
2. Completar los valores `sync: false`: conexiones PostgreSQL, frontend, CORS, Cloudinary y Stripe. El Blueprint genera `JWT_SECRET`.
3. Establecer `FRONTEND_URL=https://neokenseichronicles.netlify.app` y el mismo origen en `ALLOWED_ORIGINS`, sin barra final.
4. Sobre la base de datos de la entrega, sincronizar el esquema con `npm run prisma:push` desde un entorno autorizado antes de utilizar la API.
5. Mantener el build `npm ci --include=dev && npm run prisma:generate` y el arranque `npm start`.
6. Registrar en el entorno de prueba de Stripe el webhook `https://backend-lite-sprint13.onrender.com/payments/webhook`, suscribiendo los eventos de checkout completado y pago asíncrono correcto.
7. Guardar el secreto de ese endpoint en `STRIPE_WEBHOOK_SECRET`. No reutilizar el secreto temporal de Stripe CLI.
8. Comprobar `/health`, login, subida de imágenes y pago de prueba desde Netlify.

El Blueprint declara `autoDeployTrigger: checksPass`. Esa condición debe quedar aplicada en Render al utilizar la configuración; el archivo por sí solo no demuestra el estado de un servicio configurado manualmente. El health check de Render utiliza `/health`.

## Estado de dependencias

Auditoría consultada el **8 de septiembre de 2026** sobre el lockfile de esta entrega:

| Comando | Moderadas | Altas | Total |
| --- | --- | --- | --- |
| `npm audit` | 1 | 4 | 5 |
| `npm audit --omit=dev` | 1 | 4 | 5 |

Los **cuatro avisos altos** afectan a la cadena de herramientas de configuración de Prisma: `prisma`, `@prisma/config`, `deepmerge-ts` y `effect`. El **aviso moderado** corresponde a `qs`, dependencia transitiva de Express y body-parser. Por tanto, no todos los avisos proceden del ecosistema de base de datos.

```text
@prisma/client 6.16.2
└── prisma 6.16.2
    └── @prisma/config 6.16.2
        ├── deepmerge-ts 7.1.5
        └── effect 3.16.12
express 5.2.1
├── body-parser 2.3.0
│   └── qs 6.15.3
└── qs 6.15.3
```

Aunque Prisma está declarado en `devDependencies`, el árbol resuelto también lo enlaza desde `@prisma/client`; en esta revisión los avisos permanecen con `--omit=dev`. Además, el build de Render instala expresamente las dependencias de desarrollo. No se consideran riesgos eliminados por esa clasificación.

Las versiones resueltas se conservan en `package-lock.json` para mantener una instalación reproducible mientras se valida una actualización. **Esto no garantiza seguridad ni estabilidad por sí solo.** La auditoría indica una corrección disponible para `qs`; para la cadena Prisma propone cambiar a `6.12.0`, fuera del rango declarado. Esa propuesta no se ha aplicado ni validado en esta entrega.

La actualización queda como tarea de mantenimiento: revisar los avisos, seleccionar versiones compatibles y ejecutar generación de cliente, validación de esquema, pruebas e integración antes de desplegar. Prisma y `@prisma/client` deben actualizarse de forma coordinada. No se aplica `npm audit fix --force` automáticamente.

Para reproducir la revisión:

```bash
npm audit
npm audit --omit=dev
npm ls prisma @prisma/client @prisma/config deepmerge-ts effect qs
```

Los recuentos pueden variar cuando npm incorpora información nueva. `npm ci` instala el lockfile y puede mostrar el resumen de auditoría; el detalle se consulta con `npm audit`.

Referencias de los avisos: [DeepmergeTS](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), [Effect](https://github.com/advisories/GHSA-38f7-945m-qr2g), [qs: límites de arrays](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) y [qs: disponibilidad](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g).

El frontend tiene un informe independiente: un aviso alto en Browserslist y ninguno al excluir desarrollo en la misma fecha. El detalle figura en su README.

## Resolución de problemas

| Síntoma | Comprobación |
| --- | --- |
| Primer acceso tarda | Esperar el arranque de Render y consultar `/health`. |
| `/health` devuelve `503` | Revisar disponibilidad y conexión de PostgreSQL. |
| Prisma no conecta o no encuentra tablas | Revisar `DATABASE_URL`, `DIRECT_URL` y sincronización del esquema. |
| Falta Prisma Client | Ejecutar `npm run prisma:generate`. |
| Error CORS | Revisar el origen exacto del frontend, protocolo, puerto y `ALLOWED_ORIGINS`. |
| `401` al usar un token Bearer | Utilizar login y cookie; el middleware no admite Bearer. |
| ADMIN recibe `403` | Comprobar rol `admin` y volver a iniciar sesión si se cambió en base de datos. |
| Imagen rechazada | Verificar campo `image`, formato y límite de 5 MB. |
| Falla Cloudinary | Revisar las tres variables del servicio y sus credenciales. |
| Pedido pendiente tras pagar | Revisar eventos del webhook, firma, secreto, conectividad y logs; no repetir el pago como solución. |
| Borrado devuelve `409` | Comprobar si el producto pertenece a un pedido. |
| Registro o login devuelve `429` | Esperar la ventana configurada de limitación. |

## Mejoras futuras

Una vez completadas las funcionalidades principales, se plantean las siguientes líneas de evolución:

- Ampliar las pruebas de integración del flujo de compra.
- Incorporar reservas temporales de stock durante el pago.
- Completar el resumen desplegable del checkout en móvil.
- Añadir facturas PDF y gestión de devoluciones.
- Incorporar cupones y promociones validados por el backend.

## Limitaciones actuales

- El stock se comprueba al iniciar el checkout y se descuenta al confirmar el pago, pero no se reserva mientras el usuario paga. Si otra compra consume las existencias, la transacción puede fallar después de un pago confirmado. Este caso requiere gestión manual mientras no exista un flujo automatizado de reserva o reembolso.
- Las líneas del pedido conservan cantidad y precio de compra, pero siguen vinculadas al catálogo. Si cambia el nombre o la imagen del producto, el historial puede mostrar esos datos actualizados.

## Decisiones técnicas

La elección de PostgreSQL responde a las relaciones entre usuarios, productos, carritos y pedidos. Prisma centraliza el modelo y el acceso a datos; los servicios permiten probar la lógica con dependencias simuladas. Cloudinary evita depender del almacenamiento local del servidor, y Stripe Checkout mantiene los datos de tarjeta fuera de esta API.

La entrega incluye autenticación, autorización, CRUD, imágenes y pagos con confirmación verificada. Las recomendaciones utilizan las categorías de compras, favoritos y carrito; cuando faltan señales, muestran productos destacados.

Esta documentación diferencia el código disponible, las comprobaciones locales realizadas y el trabajo futuro. Permite reproducir el proyecto y comprender sus decisiones técnicas.
