# API local de veterinaria

API REST en Node.js/Express y PostgreSQL 18.6. Incluye tutores, mascotas, veterinarios y citas.

## Requisitos

- Node.js 20 o posterior
- Docker Desktop iniciado
- La imagen `postgres:18.6` y el volumen externo `postgres_data` en Docker Desktop

## Inicio en Windows PowerShell

```powershell
cd "C:\Users\Karen Gonzalez\Documents\Codex\2026-10-21\in\outputs\veterinaria-api"
```

Configura tus variables locales antes de iniciar PostgreSQL. En PowerShell, crea `.env` a partir de la plantilla y asigna una contraseña propia:

```powershell
Copy-Item .env.example .env
notepad .env
```

Edita `POSTGRES_PASSWORD` en `.env`; ese archivo está excluido de Git. Después:

```powershell
npm install
docker compose up -d db
npm start
```

La API escucha en `http://localhost:3000` y PostgreSQL en `localhost:5433`. El esquema y los datos de ejemplo se cargan cuando PostgreSQL inicializa por primera vez el volumen vacío.

## Rutas

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/health` | Estado de la API y conexión a PostgreSQL |
| GET / POST | `/api/owners` | Listar o registrar tutores |
| GET / POST | `/api/pets` | Listar o registrar mascotas; acepta `?owner_id=1` |
| GET | `/api/veterinarians` | Listar veterinarios activos |
| GET / POST | `/api/appointments` | Listar o agendar citas; acepta `?date=YYYY-MM-DD` |
| PATCH | `/api/appointments/:id/status` | Cambiar estado de una cita |

Estados de cita: `programada`, `confirmada`, `completada`, `cancelada`.
Especies: `perro`, `gato`, `ave`, `reptil`, `otro`.

## Ejemplos

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/pets
```

Crear un tutor:

```powershell
$body = @{ name = 'María López'; phone = '555-1234'; email = 'maria@example.com' } | ConvertTo-Json
Invoke-RestMethod http://localhost:3000/api/owners -Method Post -ContentType 'application/json' -Body $body
```

## Persistencia

El servicio usa el volumen Docker existente `postgres_data`. `docker compose down` detiene y elimina el contenedor, pero conserva el volumen. No uses `docker compose down -v` si quieres conservar los datos.
