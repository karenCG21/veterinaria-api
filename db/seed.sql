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

INSERT INTO pets (owner_id, name, species, breed, sex, birth_date, notes)
SELECT o.id, sample.name, sample.species, sample.breed, sample.sex, sample.birth_date, sample.notes
FROM owners o
CROSS JOIN (VALUES
  ('Max', 'perro', 'Mestizo', 'macho', DATE '2020-08-05', 'Paciente de ejemplo'),
  ('Nala', 'gato', 'Siames', 'hembra', DATE '2022-02-14', 'Paciente de ejemplo'),
  ('Coco', 'ave', 'Canario', 'macho', DATE '2023-06-01', 'Paciente de ejemplo'),
  ('Rocky', 'perro', 'Beagle', 'macho', DATE '2019-11-20', 'Paciente de ejemplo'),
  ('Milo', 'gato', 'Domestico', 'macho', DATE '2021-09-09', 'Paciente de ejemplo'),
  ('Kira', 'perro', 'Poodle', 'hembra', DATE '2020-03-18', 'Paciente de ejemplo'),
  ('Paco', 'ave', 'Periquito', 'macho', DATE '2024-01-10', 'Paciente de ejemplo'),
  ('Mia', 'gato', 'Persa', 'hembra', DATE '2022-12-03', 'Paciente de ejemplo'),
  ('Toby', 'perro', 'Chihuahua', 'macho', DATE '2023-04-27', 'Paciente de ejemplo')
) AS sample(name, species, breed, sex, birth_date, notes)
WHERE o.email = 'ana.torres@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM pets p WHERE p.owner_id = o.id AND p.name = sample.name
  );
