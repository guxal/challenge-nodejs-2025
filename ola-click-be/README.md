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

## Preguntas adicionales

### 1️⃣ ¿Cómo desacoplarías la lógica de negocio del framework NestJS?

Yo intentaría que Nest sea solo “el delivery mechanism” (HTTP, pipes, filtros, etc.) y que la lógica de negocio viva en capas puras, sin depender de decoradores ni clases de Nest.

En concreto:

Modelo de dominio y servicios de dominio puros

Definir entidades y servicios que no importen nada de @nestjs/*.

Ejemplo: una clase OrderDomainService con métodos como:

createOrder()

advanceStatus(order)

Esta clase trabaja con tipos/entidades del dominio (Order, OrderItem) y lanza errores propios del dominio, no HttpException.

Patrón Ports & Adapters (Hexagonal)

Definir ports (interfaces) para infra:

OrdersRepositoryPort

OrderCachePort

Y luego implementar adapters concretos con Nest/Sequelize/Redis:

SequelizeOrdersRepository implements OrdersRepositoryPort

RedisOrdersCache implements OrderCachePort

El servicio de dominio solo conoce las interfaces, no las implementaciones.

Services Nest como orquestadores

El OrdersService de Nest se convierte en una fina capa de orquestación:

Recibe DTOs.

Llama al servicio de dominio.

Traduce errores de dominio a HTTP (por ejemplo, OrderNotFoundError → 404).

Esto facilita:

Testear lógica de negocio sin levantar Nest.

Reutilizar la lógica en otros canales (cola, CLI, gRPC) sin reescribir.

Separar DTOs / validación de modelos de dominio

Los DTOs (CreateOrderDto) son solo para la capa web.

El dominio puede usar sus propios tipos/clases (OrderProps), evitando que class-validator entre en esa capa.

### 2️⃣ ¿Cómo escalarías esta API para soportar miles de órdenes concurrentes?

La idea es hacer la API stateless, con buen uso de BD, cache y observabilidad.

Escalado horizontal de la app

Contenerizada con Docker y orquestada con Kubernetes / ECS / similar.

Varios pods/instancias detrás de un load balancer.

La app no guarda estado en memoria (todo en Postgres / Redis).

Optimización de base de datos

Índices adecuados:

Por ejemplo: índice en status, createdAt.

Ajustar el connection pool (máx conexiones por instancia).

Para lecturas intensivas:

Read replicas de Postgres.

Estrategias tipo CQRS light (lecturas separadas de escrituras cuando tenga sentido).

Uso intensivo de cache

Redis para:

Lista de órdenes no entregadas (GET /orders).

Detalles de órdenes muy consultadas (GET /orders/:id opcional).

TTL corto (30s–60s) para balancear frescura vs rendimiento.

Esto reduce de forma brutal la presión sobre Postgres.

Trabajos async & colas (si el volumen crece mucho)

Si más adelante hay operaciones pesadas (ej. notificaciones, auditoría):

Usar una cola tipo Bull / RabbitMQ / Kafka.

La API recibe la orden y encola tareas no críticas.

Esto reduce el tiempo de respuesta y mejora la experiencia.

Observabilidad y autoescalado

Métricas:

Latencia, RPS, errores 5xx, conexiones a DB.

Auto-scaling (HPA) basado en:

CPU

Latencia p95

Longitud de colas (si se usan).

Logs centralizados + tracing (ej. OpenTelemetry) para detectar cuellos de botella.

Buenas prácticas de API

Idempotencia en operaciones sensibles.

Timeouts y circuit breakers en llamadas externas.

Rate limiting / throttling en el gateway si es necesario.

### 3️⃣ ¿Qué ventajas ofrece Redis en este caso y qué alternativas considerarías?

Ventajas de Redis en este reto:

Latencia muy baja para lecturas repetidas

GET /orders es una lectura muy típica que se puede cachear.

Redis responde en micro/milis, mucho más rápido que ir siempre a Postgres.

Menos carga en la base de datos

Cada request que se responde desde cache no toca Postgres.

Esto permite que la DB se concentre en escrituras y consultas no cacheables.

TTL y control fino del cache

Fácil decir “esto vive 30s y luego se invalida”.

Ideal para datos con alta frecuencia de lectura y cambios frecuentes.

Flexibilidad y tipos de datos

Podemos usar strings ahora, pero Redis también soporta listas, sets, hashes, pub/sub, etc.

Si el sistema crece, podríamos usar:

Pub/Sub para notificar cambios de órdenes.

Streams para eventos.

Alternativas que consideraría:

Memcached

Otra opción de cache en memoria distribuido.

Muy rápido y simple, pero:

Sin tipos avanzados, sin persistencia.

Menos flexible que Redis.

Cache en la capa de API Gateway / CDN

Si hubiera un API Gateway o CDN delante:

Cache de respuestas HTTP por path y querystring.

Útil para GET /orders, pero menos granular que Redis (y más complicado de invalidar por negocio).

In-memory cache local (por proceso)

Ej. node-cache, en memoria del proceso.

Sirve para entornos pequeños, pero:

No funciona bien con múltiples instancias (cada una tendría su propio cache: inconsistente).

Por eso, para un sistema escalable prefiero Redis.

Soluciones administradas

ElastiCache (AWS), Memorystore (GCP), Azure Cache for Redis:

Son Redis o equivalentes como servicio administrado.

Misma idea, pero sin gestionar servidores.

## License

[MIT licensed](LICENSE)
