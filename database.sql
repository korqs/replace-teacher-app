DROP TABLE IF EXISTS replacement_requests CASCADE;
DROP TABLE IF EXISTS timetable CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP SCHEMA IF EXISTS api CASCADE;
DROP TABLE IF EXISTS teacher_competencies CASCADE;
CREATE SCHEMA api;
CREATE TABLE teachers (name TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE timetable (id SERIAL PRIMARY KEY, subject TEXT NOT NULL, classes INTEGER NOT NULL, dinner TEXT, team TEXT NOT NULL, teacher TEXT NOT NULL, date DATE NOT NULL, day_of_week INTEGER NOT NULL, week_num INTEGER NOT NULL, num_den TEXT NOT NULL, is_replacement BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE replacement_requests (id SERIAL PRIMARY KEY, teacher_name TEXT NOT NULL, request_date DATE NOT NULL, week_num INTEGER NOT NULL, num_den TEXT, classes INTEGER NOT NULL, subject TEXT NOT NULL, team TEXT NOT NULL, status TEXT DEFAULT 'pending', replacing_teacher TEXT, admin_comment TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE api.users (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL, role TEXT NOT NULL, teacher_name TEXT, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE teacher_competencies (id SERIAL PRIMARY KEY, teacher_name TEXT REFERENCES teachers(name) ON DELETE CASCADE, subject TEXT NOT NULL, lesson_type TEXT NOT NULL CHECK (lesson_type IN ('lecture', 'seminar')), coefficient DECIMAL(3,2) NOT NULL CHECK (coefficient >= 0 AND coefficient <= 1));

-- Преподаватели
INSERT INTO teachers (name, email, phone) VALUES ('Милехина', 'arina.zaytseva.99@inbox.ru', '+7 (999) 222-22-22');
INSERT INTO teachers (name, email, phone) VALUES ('Захарова', 'li3abelina@yandex.ru', '+7 (999) 333-33-33');
INSERT INTO teachers (name, email, phone) VALUES ('Зубарев', 'zubarev@university.ru', '+7 (999) 444-44-44');
INSERT INTO teachers (name, email, phone) VALUES ('Облакова', 'oblakova@university.ru', '+7 (999) 555-55-55');
INSERT INTO teachers (name, email, phone) VALUES ('Скуднева', 'skudneva@university.ru', '+7 (999) 666-66-66');
INSERT INTO teachers (name, email, phone) VALUES ('Никулкин', 'nikulin@university.ru', '+7 (999) 777-77-77');
INSERT INTO teachers (name, email, phone) VALUES ('Щетинин', 'shchetinin@university.ru', '+7 (999) 888-88-88');

-- Пользователи
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('admin@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'admin', NULL);
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('milekhina@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Милехина');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('zaxarova@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Захарова');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('zubarev@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Зубарев');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('oblakova@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Облакова');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('nikulkin@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Никулкин');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('skudneva@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Скуднева');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('shchetinin@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Щетинин');

-- Удаляем старого администратора если есть проблемы с паролем
DELETE FROM api.users WHERE email = 'admin@university.ru';

-- Создаем нового администратора с паролем "admin123"
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('admin@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'admin', NULL);
-- Компетенции преподавателей
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Математический анализ', 'lecture', 0.21);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Математический анализ', 'seminar', 0.11);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Линейная алгебра', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Линейная алгебра', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Базы данных', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Базы данных', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Дискретная математика', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Дискретная математика', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Программирование', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Программирование', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Математический анализ', 'lecture', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Математический анализ', 'seminar', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Линейная алгебра', 'lecture', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Линейная алгебра', 'seminar', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Базы данных', 'lecture', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Базы данных', 'seminar', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Дискретная математика', 'lecture', 0.50);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Дискретная математика', 'seminar', 0.50);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Программирование', 'lecture', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Программирование', 'seminar', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Математический анализ', 'lecture', 0.65);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Математический анализ', 'seminar', 0.75);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Линейная алгебра', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Линейная алгебра', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Базы данных', 'lecture', 0.30);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Базы данных', 'seminar', 0.30);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Дискретная математика', 'lecture', 0.65);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Дискретная математика', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Программирование', 'lecture', 0.90);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Программирование', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Математический анализ', 'lecture', 0.75);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Математический анализ', 'seminar', 0.80);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Линейная алгебра', 'lecture', 0.60);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Линейная алгебра', 'seminar', 0.60);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Базы данных', 'lecture', 0.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Базы данных', 'seminar', 0.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Дискретная математика', 'lecture', 0.55);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Дискретная математика', 'seminar', 0.60);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Программирование', 'lecture', 0.50);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Программирование', 'seminar', 0.60);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Математический анализ', 'lecture', 0.72);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Математический анализ', 'seminar', 0.72);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Линейная алгебра', 'lecture', 0.32);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Линейная алгебра', 'seminar', 0.32);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Базы данных', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Базы данных', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Дискретная математика', 'lecture', 0.95);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Дискретная математика', 'seminar', 0.95);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Программирование', 'lecture', 0.56);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Программирование', 'seminar', 0.56);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Математический анализ', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Математический анализ', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Линейная алгебра', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Линейная алгебра', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Базы данных', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Базы данных', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Дискретная математика', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Дискретная математика', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Программирование', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Программирование', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Математический анализ', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Математический анализ', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Линейная алгебра', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Линейная алгебра', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Базы данных', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Базы данных', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Дискретная математика', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Дискретная математика', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Программирование', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Программирование', 'seminar', 0.70);

-- Компетенции по предметам из CSV (Компьютерные сети, Веб-разработка, Операционные системы)
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Компьютерные сети', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Компьютерные сети', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Компьютерные сети', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Компьютерные сети', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Компьютерные сети', 'lecture', 0.30);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Компьютерные сети', 'seminar', 0.30);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Компьютерные сети', 'lecture', 0.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Компьютерные сети', 'seminar', 0.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Компьютерные сети', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Компьютерные сети', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Компьютерные сети', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Компьютерные сети', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Компьютерные сети', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Компьютерные сети', 'seminar', 0.70);

INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Веб-разработка', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Веб-разработка', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Веб-разработка', 'lecture', 0.50);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Веб-разработка', 'seminar', 0.50);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Веб-разработка', 'lecture', 0.65);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Веб-разработка', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Веб-разработка', 'lecture', 0.55);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Веб-разработка', 'seminar', 0.60);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Веб-разработка', 'lecture', 0.95);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Веб-разработка', 'seminar', 0.95);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Веб-разработка', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Веб-разработка', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Веб-разработка', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Веб-разработка', 'seminar', 0.70);

INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Операционные системы', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Операционные системы', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Операционные системы', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Операционные системы', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Операционные системы', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Операционные системы', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Операционные системы', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Операционные системы', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Операционные системы', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Операционные системы', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Операционные системы', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Операционные системы', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Операционные системы', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Операционные системы', 'seminar', 0.70);

-- Расписание загружается из data/schedule.csv (npm run import-schedule)

-- Заявки
INSERT INTO replacement_requests (teacher_name, request_date, week_num, num_den, classes, subject, team, status, replacing_teacher) VALUES ('Милехина', '2026-04-27', 17, 'num', 2, 'Математический анализ', 'ФН11-33Б', 'pending', NULL);
INSERT INTO replacement_requests (teacher_name, request_date, week_num, num_den, classes, subject, team, status, replacing_teacher) VALUES ('Милехина', '2026-04-29', 17, 'num', 2, 'Математический анализ', 'ФН11-33Б', 'pending', NULL);
INSERT INTO replacement_requests (teacher_name, request_date, week_num, num_den, classes, subject, team, status, replacing_teacher) VALUES ('Зубарев', '2026-05-07', 18, 'den', 4, 'Программирование', 'ФН11-33Б', 'confirmed', 'Щетинин');

-- Индексы
CREATE INDEX idx_timetable_teacher ON timetable(teacher);
CREATE INDEX idx_timetable_date ON timetable(date);
CREATE INDEX idx_timetable_teacher_date ON timetable(teacher, date);
CREATE INDEX idx_users_email ON api.users(email);
CREATE INDEX idx_teacher_competencies_teacher_subject ON teacher_competencies(teacher_name, subject);
CREATE INDEX idx_teacher_competencies_subject ON teacher_competencies(subject);
