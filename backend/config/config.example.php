<?php
// Decisão técnica: este ficheiro é seguro para commit; valores reais ficam em config.php, ignorado pelo Git.

declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_NAME = 'weather_system';
const DB_USER = 'root';
const DB_PASS = '';
const DB_CHARSET = 'utf8mb4';

const JWT_SECRET = 'replace-with-a-long-random-secret';
const JWT_EXPIRATION_SECONDS = 7200;

const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const FRONTEND_URL = 'http://localhost:4200';
const APP_URL = 'http://localhost:8000';
const MAIL_FROM = 'no-reply@example.com';
