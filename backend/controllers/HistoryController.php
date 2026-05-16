<?php
class HistoryController {
    public function index(): void {
        $payload = AuthMiddleware::handle();
        $model   = new SearchHistory();
        Response::ok($model->findByUser((int)$payload['user_id']));
    }

    public function destroy(): void {
        $payload = AuthMiddleware::handle();
        $model   = new SearchHistory();
        $model->clearByUser((int)$payload['user_id']);
        Response::ok(null, 'Histórico limpo.');
    }
}
