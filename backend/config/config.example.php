<?php
// Ficheiro de exemplo — copiar para config.php e preencher com dados reais.
// Não commitar config.php no git.

define('DB_HOST', 'localhost');
define('DB_NAME', 'weather_db');
define('DB_USER', 'root');
define('DB_PASS', '');

define('JWT_SECRET', 'coloca_aqui_um_segredo_longo_e_aleatorio');
define('JWT_EXPIRY', 3600 * 24 * 7);

// Chave da WeatherAPI.com (https://www.weatherapi.com — plano free suficiente)
define('WEATHERAPI_KEY', 'A_TUA_CHAVE_WEATHERAPI');

define('MAIL_HOST',      'smtp.gmail.com');
define('MAIL_PORT',      587);
define('MAIL_USER',      'o_teu_email@gmail.com');
define('MAIL_PASS',      'a_tua_senha_de_app');
define('MAIL_FROM',      'o_teu_email@gmail.com');
define('MAIL_FROM_NAME', 'Weather App');

define('APP_URL', 'http://localhost:4200');
