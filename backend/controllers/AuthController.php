<?php
// Registo, login, logout e recuperação de senha.
class AuthController {

    public function register(): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $name     = Validator::sanitize($body['name']     ?? '');
        $email    = strtolower(trim($body['email']        ?? ''));
        $password = $body['password'] ?? '';

        $v = new Validator();
        $v->required('name', $name)->maxLength('name', $name, 100)
          ->required('email', $email)->email('email', $email)
          ->required('password', $password)->minLength('password', $password, 8);

        if (!$v->passes()) {
            Response::error('Dados inválidos.', 422);
        }

        $userModel = new User();
        if ($userModel->findByEmail($email)) {
            Response::error('Email já registado.', 409);
        }

        $userId = $userModel->create($name, $email, $password);
        $user   = $userModel->findById($userId);
        $token  = JwtHelper::generate(['user_id' => $userId, 'email' => $email, 'name' => $name]);

        Response::created(['user' => $user, 'token' => $token], 'Conta criada com sucesso.');
    }

    public function login(): void {
        $body  = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = strtolower(trim($body['email'] ?? ''));
        $pass  = $body['password'] ?? '';

        if (!$email || !$pass) {
            Response::error('Email e senha são obrigatórios.');
        }

        $userModel = new User();
        $user      = $userModel->findByEmail($email);

        if (!$user || !$userModel->verifyPassword($pass, $user['password'])) {
            Response::unauthorized('Credenciais inválidas.');
        }

        $token = JwtHelper::generate([
            'user_id' => $user['id'],
            'email'   => $user['email'],
            'name'    => $user['name'],
        ]);

        unset($user['password']);
        Response::ok(['user' => $user, 'token' => $token], 'Login efectuado.');
    }

    public function logout(): void {
        // Com JWT stateless, o logout é feito no cliente removendo o token.
        Response::ok(null, 'Sessão terminada.');
    }

    public function me(): void {
        $payload   = AuthMiddleware::handle();
        $userModel = new User();
        $user      = $userModel->findById($payload['user_id']);
        if (!$user) Response::notFound('Utilizador não encontrado.');
        Response::ok($user);
    }

    public function forgotPassword(): void {
        $body  = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = strtolower(trim($body['email'] ?? ''));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Email inválido.');
        }

        $userModel = new User();
        $user      = $userModel->findByEmail($email);

        // Resposta genérica para não revelar se o email existe
        if (!$user) {
            Response::ok(null, 'Se o email existir, receberás um link de recuperação em breve.');
        }

        $resetModel = new PasswordReset();
        $token      = $resetModel->create((int)$user['id']);

        // Passa o idioma do utilizador para o Mailer enviar o email no idioma correcto
        $lang = $user['language'] ?? 'pt';
        Mailer::sendPasswordReset($email, $user['name'], $token, $lang);

        Response::ok(null, 'Se o email existir, receberás um link de recuperação em breve.');
    }

    public function resetPassword(): void {
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $token    = $body['token']    ?? '';
        $password = $body['password'] ?? '';

        if (!$token || strlen($password) < 8) {
            Response::error('Token e senha (mín. 8 caracteres) são obrigatórios.');
        }

        $resetModel = new PasswordReset();
        $reset      = $resetModel->findValid($token);
        if (!$reset) {
            Response::error('Link inválido ou expirado. Solicita um novo.', 422);
        }

        $userModel = new User();

        $currentUser = $userModel->findByIdWithPassword((int)$reset['user_id']);
        if ($currentUser && $userModel->verifyPassword($password, $currentUser['password'])) {
            Response::error('A nova senha não pode ser igual à senha atual.', 422);
        }

        $userModel->updatePassword((int)$reset['user_id'], $password);
        $resetModel->markUsed((int)$reset['id']);

        Response::ok(null, 'Senha redefinida com sucesso.');
    }

    public function updatePreferences(): void {
        $payload  = AuthMiddleware::handle();
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $language = $body['language'] ?? 'pt';
        $theme    = $body['theme']    ?? 'light';

        $v = new Validator();
        $v->in('language', $language, ['pt', 'en'])->in('theme', $theme, ['light', 'dark']);
        if (!$v->passes()) Response::error('Preferências inválidas.', 422);

        $userModel = new User();
        $userModel->updatePreferences($payload['user_id'], $language, $theme);
        Response::ok(['language' => $language, 'theme' => $theme]);
    }
}
