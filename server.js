import 'dotenv/config';
import express from 'express';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5433),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || 'veterinaria',
});

app.use(express.json({ limit: '1mb' }));

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
const required = (body, fields) => fields.filter((field) =>
  body[field] === undefined || body[field] === null || String(body[field]).trim() === '',
);

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
}));

app.get('/api/owners', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM owners ORDER BY name');
  res.json(rows);
}));

app.post('/api/owners', asyncRoute(async (req, res) => {
  const missing = required(req.body, ['name', 'phone']);
  if (missing.length) return res.status(400).json({ error: `Campos requeridos: ${missing.join(', ')}` });
  const { name, phone, email = null, address = null } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO owners (name, phone, email, address) VALUES ($1, $2, $3, $4) RETURNING *',
    [name.trim(), phone.trim(), email?.trim() || null, address?.trim() || null],
  );
  res.status(201).json(rows[0]);
}));

app.get('/api/pets', asyncRoute(async (req, res) => {
  const ownerId = req.query.owner_id ? Number(req.query.owner_id) : null;
  if (ownerId !== null && !Number.isInteger(ownerId)) return res.status(400).json({ error: 'owner_id inválido' });
  const { rows } = await pool.query(
    `SELECT p.*, o.name AS owner_name, o.phone AS owner_phone
     FROM pets p JOIN owners o ON o.id = p.owner_id
     WHERE ($1::bigint IS NULL OR p.owner_id = $1)
     ORDER BY p.name`, [ownerId],
  );
  res.json(rows);
}));

app.post('/api/pets', asyncRoute(async (req, res) => {
  const missing = required(req.body, ['owner_id', 'name', 'species']);
  if (missing.length) return res.status(400).json({ error: `Campos requeridos: ${missing.join(', ')}` });
  const ownerId = Number(req.body.owner_id);
  if (!Number.isInteger(ownerId) || ownerId < 1) return res.status(400).json({ error: 'owner_id inválido' });
  const { name, species, breed = null, sex = 'desconocido', birth_date = null, microchip = null, notes = null } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO pets (owner_id, name, species, breed, sex, birth_date, microchip, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [ownerId, name.trim(), species, breed, sex, birth_date, microchip, notes],
  );
  res.status(201).json(rows[0]);
}));

app.get('/api/veterinarians', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM veterinarians WHERE active = TRUE ORDER BY name');
  res.json(rows);
}));

app.get('/api/appointments', asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, p.name AS pet_name, o.name AS owner_name, v.name AS veterinarian_name
     FROM appointments a
     JOIN pets p ON p.id = a.pet_id
     JOIN owners o ON o.id = p.owner_id
     JOIN veterinarians v ON v.id = a.veterinarian_id
     WHERE ($1::date IS NULL OR a.starts_at::date = $1::date)
     ORDER BY a.starts_at`, [req.query.date || null],
  );
  res.json(rows);
}));

app.post('/api/appointments', asyncRoute(async (req, res) => {
  const missing = required(req.body, ['pet_id', 'veterinarian_id', 'starts_at', 'reason']);
  if (missing.length) return res.status(400).json({ error: `Campos requeridos: ${missing.join(', ')}` });
  const { pet_id, veterinarian_id, starts_at, reason, notes = null } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO appointments (pet_id, veterinarian_id, starts_at, reason, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [Number(pet_id), Number(veterinarian_id), starts_at, reason.trim(), notes],
  );
  res.status(201).json(rows[0]);
}));

app.patch('/api/appointments/:id/status', asyncRoute(async (req, res) => {
  const allowed = ['programada', 'confirmada', 'completada', 'cancelada'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: `status debe ser: ${allowed.join(', ')}` });
  const { rows } = await pool.query(
    'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
    [req.body.status, Number(req.params.id)],
  );
  if (!rows.length) return res.status(404).json({ error: 'Cita no encontrada' });
  res.json(rows[0]);
}));

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === '23505') return res.status(409).json({ error: 'El correo o microchip ya está registrado' });
  if (err.code === '23503') return res.status(400).json({ error: 'La referencia indicada no existe' });
  if (err.code === '23514' || err.code === '22P02' || err.code === '22007') {
    return res.status(400).json({ error: 'Hay un valor con formato inválido' });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

const port = Number(process.env.PORT || process.env.API_PORT || 3000);
const server = app.listen(port, '0.0.0.0', () => console.log('API de veterinaria escuchando en puerto ' + port));

const shutdown = () => {
  server.close(() => pool.end().finally(() => process.exit(0)));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
