# 🌤 Weather App — Sistema de Previsão do Tempo

**Engenharia de Software II — ISPTEC 2025/2026**

Aplicação full-stack de previsão meteorológica com Angular (frontend) e PHP puro (backend), usando a [WeatherAPI.com](https://www.weatherapi.com).

---

## Stack Tecnológica

| Camada        | Tecnologia                  |
|---------------|-----------------------------|
| Frontend      | Angular 18 (standalone)     |
| Backend       | PHP 8.2+ (sem frameworks)   |
| Base de dados | MySQL / MariaDB             |
| API Meteo     | WeatherAPI.com              |
| Auth          | JWT (implementação manual)  |

---

## ⚡ Guia de Arranque Completo

### Pré-requisitos

Antes de começar, certifica-te que tens instalado:

| Ferramenta | Versão mínima | Como verificar |
|---|---|---|
| XAMPP (Apache + MySQL + PHP) | PHP 8.2+ | `php -v` |
| Node.js | 18+ | `node -v` |
| Angular CLI | 17+ | `ng version` |

> Se não tiveres o Angular CLI: `npm install -g @angular/cli`

---

### PASSO 1 — Obter a chave da WeatherAPI

1. Acede a [https://www.weatherapi.com](https://www.weatherapi.com)
2. Clica em **Sign Up** e cria uma conta gratuita
3. Após o login, copia a tua **API Key** no dashboard
4. O plano gratuito inclui 1 000 000 chamadas/mês — mais do suficiente

---

### PASSO 2 — Base de dados (MySQL)

Abre o **phpMyAdmin** (http://localhost/phpmyadmin) ou o terminal MySQL e corre:

```sql
-- Criar base de dados e tabelas
source C:/xampp/htdocs/weather-app/database/schema.sql
```

Ou, se preferires pelo terminal:
```bash
mysql -u root -p < database/schema.sql
```

> **Se já tinhas a base de dados de uma versão anterior**, corre ainda este comando para corrigir a constraint de favoritos:
> ```sql
> USE weather_db;
> ALTER TABLE favourite_cities DROP INDEX uniq_user_city;
> ALTER TABLE favourite_cities ADD UNIQUE KEY uniq_user_city (user_id, city_name);
> ```

---

### PASSO 3 — Configurar o Backend

1. Copia a pasta `backend/` e `database/` para dentro do XAMPP:

   ```
   C:/xampp/htdocs/weather-app/
   ├── backend/
   ├── database/
   ```

2. Edita o ficheiro `backend/config/config.php`:

   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'weather_db');
   define('DB_USER', 'root');
   define('DB_PASS', '');   // senha do MySQL (vazia por defeito no XAMPP)

   define('JWT_SECRET', 'coloca_aqui_uma_string_longa_e_aleatoria_minimo_32_chars');

   // ✅ Cola aqui a tua chave da WeatherAPI (Passo 1)
   define('WEATHERAPI_KEY', 'a_tua_chave_aqui');

   // Email (opcional — para recuperação de senha funcionar por email)
   define('MAIL_HOST',      'smtp.gmail.com');
   define('MAIL_PORT',      587);
   define('MAIL_USER',      'o_teu_gmail@gmail.com');
   define('MAIL_PASS',      'xxxx xxxx xxxx xxxx');  // App Password do Gmail
   define('MAIL_FROM',      'o_teu_gmail@gmail.com');
   define('MAIL_FROM_NAME', 'Weather App');

   define('APP_URL', 'http://localhost:4200');
   ```

   > **Nota sobre App Password do Gmail:** vai a myaccount.google.com → Segurança → Verificação em dois passos → Passwords de app → gera uma password de 16 caracteres.
   >
   > **Sem email configurado:** o link de recuperação de senha é guardado em `backend/logs/emails.log` para poderes usá-lo manualmente durante o desenvolvimento.

3. Inicia o servidor PHP (na pasta `backend/`):

   ```bash
   cd backend
   php -S localhost:8000
   ```

   Deverás ver:
   ```
   PHP Development Server (http://localhost:8000) started
   ```

---

### PASSO 4 — Configurar e arrancar o Frontend

1. Instala as dependências (só é preciso fazer uma vez):

   ```bash
   cd frontend
   npm install
   ```

2. Arranca o servidor de desenvolvimento:

   ```bash
   ng serve
   ```

   Deverás ver:
   ```
   ✔ Compiled successfully
   ➜  Local: http://localhost:4200/
   ```

3. Abre o browser em **http://localhost:4200**

---

### PASSO 5 — Verificar que tudo funciona

Confirma cada ponto:

- [ ] A página de login abre em http://localhost:4200/login
- [ ] Criar conta redireciona para a página de login
- [ ] Iniciar sessão redireciona para o dashboard
- [ ] A localização GPS é detetada automaticamente no dashboard
- [ ] O nome do utilizador aparece no cabeçalho
- [ ] A pesquisa de cidades mostra sugestões no dropdown
- [ ] O botão ⭐ de favoritos funciona (adicionar e remover)
- [ ] Comparar cidades mostra dropdown de sugestões nos dois campos
- [ ] O modo escuro/claro alterna corretamente
- [ ] A língua muda entre Português e Inglês
- [ ] A exportação CSV e PDF funciona

---

### Estrutura de pastas

```
weather-app/
├── backend/
│   ├── config/
│   │   ├── config.php          ← ✏️ EDITAR com as tuas credenciais
│   │   └── config.example.php  ← exemplo de referência
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── logs/                   ← emails de recuperação (dev)
│   └── index.php
├── database/
│   └── schema.sql              ← correr no MySQL
└── frontend/
    ├── src/
    │   ├── app/
    │   ├── assets/             ← favicon e recursos estáticos
    │   ├── environments/
    │   └── index.html
    ├── angular.json
    └── package.json
```

---

### Resolução de problemas comuns

| Problema | Causa provável | Solução |
|---|---|---|
| `CORS error` no browser | Backend não está a correr | Verificar `php -S localhost:8000` na pasta `backend/` |
| `401 Unauthorized` | Token expirado ou inválido | Fazer logout e login novamente |
| `Cidade não encontrada` | Chave WeatherAPI inválida | Verificar `WEATHERAPI_KEY` em `config.php` |
| Favoritos não guardam | Constraint antiga na BD | Correr o ALTER TABLE do Passo 2 |
| Email de recuperação não chega | SMTP não configurado | Ver o link em `backend/logs/emails.log` |
| `npm install` falha | Versão Node desatualizada | Atualizar Node.js para 18+ |
