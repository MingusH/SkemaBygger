-- Initial data for SkemaBygger database
-- This script runs when the PostgreSQL container starts

-- Insert some sample teachers
INSERT INTO teachers (fornavn, efternavn, email, initialer, telefon, ansat_dato, stilling, aktiv, oprettet_dato) VALUES
('Jens', 'Hansen', 'jens.hansen@skole.dk', 'JH', '12345678', '2020-08-01 09:00:00', 'Lærer', true, NOW()),
('Mette', 'Nielsen', 'mette.nielsen@skole.dk', 'MN', '87654321', '2018-08-01 09:00:00', 'Lærer', true, NOW()),
('Søren', 'Petersen', 'soren.petersen@skole.dk', 'SP', '11223344', '2015-08-01 09:00:00', 'Inspektør', true, NOW());

-- Insert some sample classrooms
INSERT INTO classrooms (navn, aargang, skoleaar, laerer_id, kapacitet, lokale, aktiv, oprettet_dato) VALUES
('3.A', '3. klasse', '2023/2024', 1, 28, 'Rum 101', true, NOW()),
('3.B', '3. klasse', '2023/2024', 2, 26, 'Rum 102', true, NOW()),
('5.A', '5. klasse', '2023/2024', 1, 30, 'Rum 201', true, NOW());

-- Insert some sample subjects
INSERT INTO subjects (navn, kort_navn, laerer_id, farve, aktiv) VALUES
('Matematik', 'Mat', 1, '#FF6B6B', true),
('Dansk', 'Da', 2, '#4ECDC4', true),
('Engelsk', 'En', 1, '#45B7D1', true),
('Natur/Teknik', 'NT', 2, '#96CEB4', true);

-- Insert some sample students
INSERT INTO students (fornavn, efternavn, email, foedselsdato, elevnummer, klasse_id, aktiv, oprettet_dato) VALUES
('Oliver', 'Jensen', 'oliver.jensen@email.dk', '2014-03-15 09:00:00', '2023001', 1, true, NOW()),
('Emma', 'Nielsen', 'emma.nielsen@email.dk', '2014-05-22 09:00:00', '2023002', 1, true, NOW()),
('Lucas', 'Hansen', 'lucas.hansen@email.dk', '2014-08-10 09:00:00', '2023003', 1, true, NOW()),
('Sofie', 'Petersen', 'sofie.petersen@email.dk', '2014-11-28 09:00:00', '2023004', 2, true, NOW()),
('William', 'Christensen', 'william.christensen@email.dk', '2014-01-07 09:00:00', '2023005', 2, true, NOW());
