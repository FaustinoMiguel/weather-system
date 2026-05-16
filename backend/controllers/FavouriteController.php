<?php
class FavouriteController {
    public function index(): void {
        $payload = AuthMiddleware::handle();
        $model   = new FavouriteCity();
        Response::ok($model->findByUser((int)$payload['user_id']));
    }

    public function store(): void {
        $payload = AuthMiddleware::handle();
        $body    = json_decode(file_get_contents('php://input'), true) ?? [];

        $cityName    = Validator::sanitize($body['city_name']    ?? '');
        $countryCode = Validator::sanitize($body['country_code'] ?? '');
        $lat         = (float)($body['latitude']  ?? 0);
        $lon         = (float)($body['longitude'] ?? 0);

        if (!$cityName || !$countryCode) {
            Response::error('city_name e country_code são obrigatórios.');
        }

        $model  = new FavouriteCity();
        $result = $model->add((int)$payload['user_id'], $cityName, $countryCode, $lat, $lon);
        Response::created($result, 'Cidade adicionada aos favoritos.');
    }

    public function destroy(int $id): void {
        $payload = AuthMiddleware::handle();
        $model   = new FavouriteCity();

        if (!$model->remove($id, (int)$payload['user_id'])) {
            Response::notFound('Favorito não encontrado.');
        }
        Response::ok(null, 'Cidade removida dos favoritos.');
    }
}
