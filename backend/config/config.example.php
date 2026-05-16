<?php
// Copiar este ficheiro para config.php e preencher com os valores reais.
// NUNCA commitar config.php no git.

define('DB_HOST', 'localhost');
define('DB_NAME', 'weather_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Segredo para assinar tokens JWT — usar string longa e aleatória
define('JWT_SECRET', 'ALTERAR_PARA_STRING_ALEATORIA_LONGA');
define('JWT_EXPIRY', 3600 * 24 * 7); // 7 dias em segundos

// Configuração SMTP para envio de emails (recuperação de senha)
define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_PORT', 587);
define('MAIL_USER', 'o_teu_email@gmail.com');
define('MAIL_PASS', 'a_tua_senha_de_app');
define('MAIL_FROM', 'o_teu_email@gmail.com');
define('MAIL_FROM_NAME', 'Weather App');

// URL base do frontend (para links nos emails)
define('APP_URL', 'http://localhost:4200');

// Open-Meteo não precisa de chave de API — é gratuito e aberto.
