-- Sistema de Previsão do Tempo — schema.sql
-- Executar: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS weather_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE weather_db;

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  language   VARCHAR(5)   DEFAULT 'pt',
  theme      VARCHAR(10)  DEFAULT 'light',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favourite_cities (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  city_name    VARCHAR(100) NOT NULL,
  country_code VARCHAR(5)   NOT NULL,
  latitude     DECIMAL(9,6),
  longitude    DECIMAL(9,6),
  added_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_city (user_id, city_name)
);

CREATE TABLE IF NOT EXISTS search_history (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  city_name       VARCHAR(100) NOT NULL,
  country_code    VARCHAR(5),
  latitude        DECIMAL(9,6),
  longitude       DECIMAL(9,6),
  temperature     DECIMAL(5,2),
  condition_text  VARCHAR(100),
  searched_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used       TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
