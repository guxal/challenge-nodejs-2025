# Ola Click API

API REST para gestión de pedidos desarrollada con NestJS, PostgreSQL, Redis y Sequelize.

## Descripción

Sistema de gestión de pedidos que permite crear, consultar y avanzar el estado de pedidos. Los pedidos pueden tener tres estados: `initiated`, `sent` y `delivered`. Una vez entregados, los pedidos se eliminan automáticamente de la base de datos.

## Requisitos Previos

- Docker y Docker Compose instalados
- Node.js 20+ (si ejecutas localmente sin Docker)

## Instalación y Ejecución

### Opción 1: Docker Compose (Recomendado)

1. **Clonar el repositorio y navegar al directorio:**
```bash
cd ola-click-be
```

2. **Crear archivo `.env` con las siguientes variables:**
```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=restaurant
REDIS_HOST=redis
REDIS_PORT=6379
APP_PORT=3000
```

3. **Levantar los servicios:**
```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en el puerto `5432`
- Redis en el puerto `6379`
- La aplicación NestJS en el puerto `3000`

4. **Verificar que todo esté corriendo:**
```bash
docker-compose ps
```

5. **Ver los logs de la aplicación:**
```bash
docker-compose logs -f app
```

### Opción 2: Docker (Sin Docker Compose)

1. **Levantar PostgreSQL y Redis manualmente:**
```bash
docker run -d --name postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=restaurant -p 5432:5432 postgres:15
docker run -d --name redis -p 6379:6379 redis:7
```

2. **Construir la imagen de la aplicación:**
```bash
docker build -f .docker/Dockerfile -t ola-click-be .
```

3. **Ejecutar el contenedor:**
```bash
docker run -d --name app --link postgres --link redis -p 3000:3000 --env-file .env ola-click-be
```

### Opción 3: Ejecución Local (Sin Docker)

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno en `.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=restaurant
REDIS_HOST=localhost
REDIS_PORT=6379
APP_PORT=3000
```

3. **Asegurarse de tener PostgreSQL y Redis corriendo localmente**

4. **Ejecutar en modo desarrollo:**
```bash
npm run start:dev
```

## Ejecutar Tests

### Tests dentro de Docker

**Tests E2E:**
```bash
# Opción 1: En contenedor en ejecución
docker-compose exec app npm run test:e2e

# Opción 2: Contenedor temporal
docker-compose run --rm app npm run test:e2e
```

**Tests unitarios:**
```bash
docker-compose exec app npm run test
```

**Cobertura de tests:**
```bash
docker-compose exec app npm run test:cov
```

### Tests localmente

```bash
# Tests unitarios
npm run test

# Tests E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## Probar Endpoints

### Opción 1: Swagger UI (Recomendado)

Una vez que la aplicación esté corriendo, accede a la documentación interactiva de Swagger:

```
http://localhost:3000/docs
```

Desde aquí puedes:
- Ver todos los endpoints disponibles
- Probar cada endpoint directamente desde el navegador
- Ver los esquemas de request/response
- Ejecutar peticiones y ver respuestas en tiempo real

### Opción 2: cURL

**1. Listar todos los pedidos pendientes:**
```bash
curl -X GET http://localhost:3000/orders
```

**2. Obtener un pedido por ID:**
```bash
curl -X GET http://localhost:3000/orders/1
```

**3. Crear un nuevo pedido:**
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Juan Pérez",
    "items": [
      {
        "description": "Combo hamburguesa",
        "quantity": 2,
        "unitPrice": 25.5
      },
      {
        "description": "Bebida",
        "quantity": 1,
        "unitPrice": 5.0
      }
    ]
  }'
```

**4. Avanzar el estado de un pedido:**
```bash
# De 'initiated' a 'sent'
curl -X POST http://localhost:3000/orders/1/advance

# De 'sent' a 'delivered' (el pedido se eliminará)
curl -X POST http://localhost:3000/orders/1/advance
```

### Opción 3: Postman

1. **Importar colección:**
   - Abre Postman
   - Crea una nueva colección llamada "Ola Click API"
   - Agrega las siguientes requests:

2. **GET - Listar pedidos:**
   - Method: `GET`
   - URL: `http://localhost:3000/orders`

3. **GET - Obtener pedido:**
   - Method: `GET`
   - URL: `http://localhost:3000/orders/:id`
   - Variables: `id = 1`

4. **POST - Crear pedido:**
   - Method: `POST`
   - URL: `http://localhost:3000/orders`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
   ```json
   {
     "clientName": "Juan Pérez",
     "items": [
       {
         "description": "Combo hamburguesa",
         "quantity": 2,
         "unitPrice": 25.5
       }
     ]
   }
   ```

5. **POST - Avanzar estado:**
   - Method: `POST`
   - URL: `http://localhost:3000/orders/:id/advance`
   - Variables: `id = 1`

## Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/orders` | Lista todos los pedidos pendientes (no entregados) |
| GET | `/orders/:id` | Obtiene un pedido específico por ID |
| POST | `/orders` | Crea un nuevo pedido |
| POST | `/orders/:id/advance` | Avanza el estado del pedido (initiated → sent → delivered) |

## Consideraciones Técnicas

### Arquitectura

- **Framework:** NestJS 11
- **Base de datos:** PostgreSQL 15 con Sequelize ORM
- **Cache:** Redis 7 para cacheo de consultas
- **Validación:** class-validator y class-transformer
- **Documentación:** Swagger/OpenAPI

### Estados de Pedidos

Los pedidos tienen tres estados posibles:
- `initiated`: Pedido creado, pendiente de envío
- `sent`: Pedido enviado, en camino
- `delivered`: Pedido entregado (se elimina automáticamente)

### Cache

- La lista de pedidos se cachea en Redis por 30 segundos
- El cache se invalida automáticamente al crear o actualizar pedidos
- Los pedidos entregados no aparecen en la lista (filtro en base de datos)

### Base de Datos

- **Tablas:**
  - `orders`: Almacena información de pedidos
  - `order_items`: Almacena los ítems de cada pedido
- **Relaciones:** Un pedido tiene muchos ítems (1:N)
- **Sincronización:** `synchronize: true` en desarrollo (crea tablas automáticamente)

### Validaciones

- `clientName`: Requerido, string no vacío
- `items`: Array requerido con al menos un ítem
- Cada ítem requiere:
  - `description`: String no vacío
  - `quantity`: Entero mayor a 0
  - `unitPrice`: Número mayor o igual a 0

### Manejo de Errores

- `404 Not Found`: Cuando un pedido no existe
- `400 Bad Request`: Cuando la validación falla
- Validación automática de tipos y formatos

### Variables de Entorno

Asegúrate de configurar correctamente:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Configuración de PostgreSQL
- `REDIS_HOST`, `REDIS_PORT`: Configuración de Redis
- `APP_PORT`: Puerto donde corre la aplicación (default: 3000)

### Docker

- El Dockerfile usa Node.js 20 Alpine para una imagen ligera
- Multi-stage build para optimizar el tamaño
- Volúmenes para desarrollo (opcional)

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev      # Modo watch
npm run start:debug    # Modo debug

# Producción
npm run build          # Compilar
npm run start:prod     # Ejecutar compilado

# Testing
npm run test           # Tests unitarios
npm run test:watch     # Tests en modo watch
npm run test:e2e       # Tests end-to-end
npm run test:cov       # Cobertura de código

# Calidad de código
npm run lint           # Linter con auto-fix
npm run format         # Formatear código
```

## Troubleshooting

**Error de conexión a PostgreSQL:**
- Verifica que el contenedor de PostgreSQL esté corriendo: `docker-compose ps`
- Revisa las variables de entorno en `.env`
- Verifica los logs: `docker-compose logs postgres`

**Error de conexión a Redis:**
- Verifica que el contenedor de Redis esté corriendo: `docker-compose ps`
- Revisa las variables de entorno en `.env`
- Verifica los logs: `docker-compose logs redis`

**La aplicación no inicia:**
- Revisa los logs: `docker-compose logs app`
- Verifica que todas las dependencias estén corriendo
- Asegúrate de que el puerto 3000 no esté en uso

**Tests fallan:**
- Asegúrate de que PostgreSQL y Redis estén corriendo
- Verifica que las variables de entorno de test estén configuradas
- Ejecuta `npm install` para asegurar dependencias actualizadas

## License

[MIT licensed](LICENSE)
