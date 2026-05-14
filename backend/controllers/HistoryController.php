<?php
// Decisão técnica: histórico é consultado com limite para manter respostas rápidas no dashboard.

declare(strict_types=1);

final class HistoryController
{
    private SearchHistory $history;

    public function __construct(PDO $db)
    {
        $this->history = new SearchHistory($db);
    }

    public function index(array $query, array $user): void
    {
        $limit = isset($query['limit']) ? max(1, min(100, (int) $query['limit'])) : 20;
        Response::json(true, $this->history->latest($user['id'], $limit), 'Histórico carregado.');
    }

    public function clear(array $user): void
    {
        $this->history->clear($user['id']);
        Response::json(true, null, 'Histórico limpo.');
    }
}
