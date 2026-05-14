<?php
// Decisão técnica: entry point único aplica CORS, carrega dependências e despacha rotas HTTP.

declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/Validator.php';
require_once __DIR__ . '/utils/JwtHelper.php';
require_once __DIR__ . '/utils/Mailer.php';
require_once __DIR__ . '/utils/SimplePdf.php';
require_once __DIR__ . '/utils/WeatherMapper.php';
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/models/FavouriteCity.php';
require_once __DIR__ . '/models/SearchHistory.php';
require_once __DIR__ . '/models/PasswordReset.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/WeatherController.php';
require_once __DIR__ . '/controllers/FavouriteController.php';
require_once __DIR__ . '/controllers/HistoryController.php';
require_once __DIR__ . '/controllers/ExportController.php';

header('Access-Control-Allow-Origin: ' . FRONTEND_URL);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

set_exception_handler(static function (Throwable $error): void {
    Response::error('Erro interno do servidor.', 500, ['detail' => $error->getMessage()]);
});

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$script = dirname($_SERVER['SCRIPT_NAME']);
if ($script !== '/' && str_starts_with($path, $script)) {
    $path = substr($path, strlen($script)) ?: '/';
}

$routes = require __DIR__ . '/routes/api.php';
$db = Database::connection();
$input = json_decode(file_get_contents('php://input') ?: '[]', true);
$payload = is_array($input) ? $input : [];

foreach ($routes as [$routeMethod, $pattern, $handler, $requiresAuth]) {
    if ($method !== $routeMethod || preg_match($pattern, $path, $matches) !== 1) {
        continue;
    }

    $user = $requiresAuth ? AuthMiddleware::user($db) : null;
    $controllerClass = $handler[0];
    $controller = new $controllerClass($db);
    $action = $handler[1];

    if ($method === 'GET') {
        $controller->$action($_GET, $user ?? []);
        exit;
    }

    if ($method === 'DELETE' && isset($matches['id'])) {
        $controller->$action((int) $matches['id'], $user ?? []);
        exit;
    }

    if ($method === 'DELETE') {
        $controller->$action($user ?? []);
        exit;
    }

    if ($requiresAuth && $path === '/auth/logout') {
        $controller->$action($user ?? []);
        exit;
    }

    if ($requiresAuth) {
        $controller->$action($payload, $user ?? []);
        exit;
    }

    $controller->$action($payload);
    exit;
}

Response::error('Rota não encontrada.', 404);
