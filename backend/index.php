<?php
// Entry point do backend — carrega configuração, classes e encaminha pedidos.

// Carrega configuração (nunca commitar config.php — usar config.example.php como template)
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';

// Utils
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/Validator.php';
require_once __DIR__ . '/utils/JwtHelper.php';
require_once __DIR__ . '/utils/Mailer.php';
require_once __DIR__ . '/utils/WeatherMapper.php';
require_once __DIR__ . '/utils/SimplePdf.php';

// Middleware
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// Models
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/models/FavouriteCity.php';
require_once __DIR__ . '/models/SearchHistory.php';
require_once __DIR__ . '/models/PasswordReset.php';

// Controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/WeatherController.php';
require_once __DIR__ . '/controllers/FavouriteController.php';
require_once __DIR__ . '/controllers/HistoryController.php';
require_once __DIR__ . '/controllers/ExportController.php';

// Routes
require_once __DIR__ . '/routes/api.php';

// Headers CORS — ajustar origem em produção
header('Access-Control-Allow-Origin: http://localhost:4200');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
// FIX: expõe Content-Disposition para que o Angular consiga ler o nome do ficheiro
header('Access-Control-Expose-Headers: Content-Disposition, Content-Type');

// Responde ao preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// FIX: NÃO definir Content-Type: application/json globalmente aqui.
// As rotas de exportação (/export/csv e /export/pdf) precisam de definir
// o seu próprio Content-Type (text/csv e application/pdf). Se este header
// for enviado aqui, o PHP ignora os headers posteriores do controller
// e o browser recebe JSON em vez do ficheiro binário.
//
// Cada controller JSON chama Response::json() que define o Content-Type
// correcto por si próprio. Nada a fazer aqui.

// Extrai método e caminho
$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove prefixo /api se presente
$path = preg_replace('#^/api#', '', $path);
$path = rtrim($path, '/') ?: '/';

matchRoute($method, $path);
