<?php
// Definição de todas as rotas da API.
// Formato: METHOD /caminho => [Controlador, método, params]

function matchRoute(string $method, string $path): void {
    $weatherCtrl    = new WeatherController();
    $authCtrl       = new AuthController();
    $favouriteCtrl  = new FavouriteController();
    $historyCtrl    = new HistoryController();
    $exportCtrl     = new ExportController();

    $routes = [
        // Autenticação
        ['POST',   '/auth/register',        [$authCtrl,      'register']],
        ['POST',   '/auth/login',           [$authCtrl,      'login']],
        ['POST',   '/auth/logout',          [$authCtrl,      'logout']],
        ['POST',   '/auth/forgot-password', [$authCtrl,      'forgotPassword']],
        ['POST',   '/auth/reset-password',  [$authCtrl,      'resetPassword']],
        ['GET',    '/auth/me',              [$authCtrl,      'me']],
        ['PUT',    '/auth/preferences',     [$authCtrl,      'updatePreferences']],

        // Tempo
        ['GET',    '/weather/search',       [$weatherCtrl,   'search']],
        ['GET',    '/weather/forecast',     [$weatherCtrl,   'forecast']],
        ['GET',    '/weather/suggest',    [$weatherCtrl,   'suggest']],
        ['GET',    '/weather/forecast/coords', [$weatherCtrl,   'forecastByCoords']],
        ['GET',    '/weather/coords',       [$weatherCtrl,   'searchByCoords']],
        ['GET',    '/weather/compare',      [$weatherCtrl,   'compare']],

        // Favoritos
        ['GET',    '/favourites',           [$favouriteCtrl, 'index']],
        ['POST',   '/favourites',           [$favouriteCtrl, 'store']],
        ['DELETE', '/favourites/{id}',      [$favouriteCtrl, 'destroy']],

        // Histórico
        ['GET',    '/history',              [$historyCtrl,   'index']],
        ['DELETE', '/history',              [$historyCtrl,   'destroy']],

        // Exportação
        ['GET',    '/export/csv',           [$exportCtrl,    'csv']],
        ['GET',    '/export/pdf',           [$exportCtrl,    'pdf']],
    ];

    foreach ($routes as [$routeMethod, $routePath, $handler]) {
        if ($routeMethod !== $method) continue;

        // Converte padrão de rota com parâmetros {id} para regex
        $pattern = preg_replace('/\{(\w+)\}/', '(\d+)', $routePath);
        if (preg_match("#^$pattern$#", $path, $matches)) {
            array_shift($matches); // remove match completo
            call_user_func_array($handler, $matches);
            return;
        }
    }

    Response::notFound('Rota não encontrada.');
}
