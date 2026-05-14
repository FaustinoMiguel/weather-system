<?php
// Decisão técnica: favoritos são sempre filtrados pelo utilizador autenticado para preservar isolamento de dados.

declare(strict_types=1);

final class FavouriteController
{
    private FavouriteCity $favourites;

    public function __construct(PDO $db)
    {
        $this->favourites = new FavouriteCity($db);
    }

    public function index(array $query, array $user): void
    {
        Response::json(true, $this->favourites->all($user['id']), 'Favoritos carregados.');
    }

    public function store(array $payload, array $user): void
    {
        $errors = Validator::required($payload, ['city_name', 'country_code']);
        if (!isset($errors['city_name']) && !Validator::city((string) $payload['city_name'])) {
            $errors['city_name'] = 'Cidade inválida.';
        }
        if ($errors !== []) {
            Response::error('Dados inválidos.', 422, $errors);
        }

        try {
            $id = $this->favourites->create($user['id'], trim((string) $payload['city_name']), trim((string) $payload['country_code']));
        } catch (PDOException $error) {
            Response::error('Cidade já está nos favoritos.', 409);
        }

        Response::json(true, ['id' => $id], 'Cidade adicionada aos favoritos.', 201);
    }

    public function delete(int $id, array $user): void
    {
        if (!$this->favourites->delete($user['id'], $id)) {
            Response::error('Favorito não encontrado.', 404);
        }

        Response::json(true, null, 'Favorito removido.');
    }
}
