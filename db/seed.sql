INSERT INTO owners (name, phone, email, address)
VALUES ('Ana Torres', '555-0101', 'ana.torres@example.com', 'Colonia Centro')
ON CONFLICT (email) DO NOTHING;

INSERT INTO veterinarians (name, specialty, phone, email)
VALUES
  ('Dra. Lucía Méndez', 'Medicina general', '555-0201', 'lucia@vet.local'),
  ('Dr. Rafael Ortiz', 'Dermatología veterinaria', '555-0202', 'rafael@vet.local')
ON CONFLICT (email) DO NOTHING;

INSERT INTO pets (owner_id, name, species, breed, sex, birth_date, notes)
SELECT o.id, 'Luna', 'perro', 'Labrador', 'hembra', DATE '2021-04-12', 'Ejemplo de paciente'
FROM owners o WHERE o.email = 'ana.torres@example.com'
  AND NOT EXISTS (SELECT 1 FROM pets p WHERE p.name = 'Luna' AND p.owner_id = o.id);