<?php
// Decisão técnica: controller de autenticação concentra fluxo de conta e mantém JWT stateless com blacklist no logout.

declare(strict_types=1);

final class AuthController
{
    private User $users;
    private PasswordReset $resets;

    public function __construct(private readonly PDO $db)
    {
        $this->users = new User($db);
        $this->resets = new PasswordReset($db);
    }

    public function register(array $payload): void
    {
        $errors = Validator::required($payload, ['name', 'email', 'password']);
        if (!isset($errors['email']) && !Validator::email((string) $payload['email'])) {
            $errors['email'] = 'Email inválido.';
        }
        if (!isset($errors['password']) && !Validator::password((string) $payload['password'])) {
            $errors['password'] = 'A senha deve ter 8 caracteres, maiúscula, minúscula e número.';
        }
        if ($errors !== []) {
            Response::error('Dados inválidos.', 422, $errors);
        }
        if ($this->users->findByEmail((string) $payload['email'])) {
            Response::error('Email já registado.', 409);
        }

        $id = $this->users->create(trim((string) $payload['name']), (string) $payload['email'], (string) $payload['password']);
        $user = $this->users->findById($id);
        $token = JwtHelper::generate(['sub' => $id, 'email' => $user['email']]);

        Response::json(true, ['user' => $user, 'token' => $token], 'Utilizador registado com sucesso.', 201);
    }

    public function login(array $payload): void
    {
        $errors = Validator::required($payload, ['email', 'password']);
        if ($errors !== []) {
            Response::error('Dados inválidos.', 422, $errors);
        }

        $user = $this->users->findByEmail((string) $payload['email']);
        if (!$user || !password_verify((string) $payload['password'], (string) $user['password'])) {
            Response::error('Credenciais inválidas.', 401);
        }

        $publicUser = $this->users->findById((int) $user['id']);
        $token = JwtHelper::generate(['sub' => (int) $user['id'], 'email' => $user['email']]);

        Response::json(true, ['user' => $publicUser, 'token' => $token], 'Login efectuado com sucesso.');
    }

    public function logout(array $user): void
    {
        $stmt = $this->db->prepare('INSERT IGNORE INTO jwt_blacklist (token_jti, user_id, expires_at) VALUES (:jti, :user_id, :expires_at)');
        $stmt->execute([
            'jti' => $user['jti'],
            'user_id' => $user['id'],
            'expires_at' => date('Y-m-d H:i:s', $user['exp']),
        ]);

        Response::json(true, null, 'Logout efectuado com sucesso.');
    }

    public function forgotPassword(array $payload): void
    {
        $errors = Validator::required($payload, ['email']);
        if ($errors !== []) {
            Response::error('Dados inválidos.', 422, $errors);
        }

        $user = $this->users->findByEmail((string) $payload['email']);
        if ($user) {
            $token = bin2hex(random_bytes(32));
            $this->resets->create((int) $user['id'], $token);
            Mailer::sendPasswordReset((string) $user['email'], (string) $user['name'], $token);
        }

        Response::json(true, null, 'Se o email existir, será enviado um link temporário.');
    }

    public function resetPassword(array $payload): void
    {
        $errors = Validator::required($payload, ['token', 'password']);
        if (!isset($errors['password']) && !Validator::password((string) $payload['password'])) {
            $errors['password'] = 'A senha deve ter 8 caracteres, maiúscula, minúscula e número.';
        }
        if ($errors !== []) {
            Response::error('Dados inválidos.', 422, $errors);
        }

        $reset = $this->resets->valid((string) $payload['token']);
        if (!$reset) {
            Response::error('Token inválido ou expirado.', 422);
        }

        $this->users->updatePassword((int) $reset['user_id'], (string) $payload['password']);
        $this->resets->markUsed((int) $reset['id']);

        Response::json(true, null, 'Senha redefinida com sucesso.');
    }
}
