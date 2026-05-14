<?php
// Decisão técnica: tabela de rotas simples mantém PHP puro sem framework e ainda permite parâmetros por regex.

declare(strict_types=1);

return [
    ['POST', '#^/auth/register$#', [AuthController::class, 'register'], false],
    ['POST', '#^/auth/login$#', [AuthController::class, 'login'], false],
    ['POST', '#^/auth/logout$#', [AuthController::class, 'logout'], true],
    ['POST', '#^/auth/forgot-password$#', [AuthController::class, 'forgotPassword'], false],
    ['POST', '#^/auth/reset-password$#', [AuthController::class, 'resetPassword'], false],
    ['GET', '#^/weather/search$#', [WeatherController::class, 'search'], true],
    ['GET', '#^/weather/forecast$#', [WeatherController::class, 'forecast'], true],
    ['GET', '#^/favourites$#', [FavouriteController::class, 'index'], true],
    ['POST', '#^/favourites$#', [FavouriteController::class, 'store'], true],
    ['DELETE', '#^/favourites/(?P<id>\d+)$#', [FavouriteController::class, 'delete'], true],
    ['GET', '#^/history$#', [HistoryController::class, 'index'], true],
    ['DELETE', '#^/history$#', [HistoryController::class, 'clear'], true],
    ['GET', '#^/export/csv$#', [ExportController::class, 'csv'], true],
    ['GET', '#^/export/pdf$#', [ExportController::class, 'pdf'], true],
];
