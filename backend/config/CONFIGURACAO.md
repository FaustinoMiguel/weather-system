# ⚙️ Configuração do Backend — Weather App

## PASSO 1 — Criar o config.php

Cria um ficheiro chamado `config.php` dentro desta pasta (`backend/config/`) com o seguinte conteúdo:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'weather_db');
define('DB_USER', 'root');
define('DB_PASS', '');

define('JWT_SECRET', 'coloca_aqui_uma_string_longa_minimo_32_caracteres');
define('JWT_EXPIRY', 3600 * 24 * 7);

// Chave da WeatherAPI.com — regista em https://www.weatherapi.com (gratuito)
define('WEATHERAPI_KEY', 'A_TUA_CHAVE_AQUI');

// Configuração de email para recuperação de senha
define('MAIL_HOST',      'smtp.gmail.com');
define('MAIL_PORT',      587);
define('MAIL_USER',      'o_teu_email@gmail.com');
define('MAIL_PASS',      'xxxx xxxx xxxx xxxx');
define('MAIL_FROM',      'o_teu_email@gmail.com');
define('MAIL_FROM_NAME', 'Weather App');

define('APP_URL', 'http://localhost:4200');
```

---

## PASSO 2 — Chave da WeatherAPI

1. Vai a **https://www.weatherapi.com**
2. Clica em **Sign Up** → cria conta gratuita
3. Após login, copia a **API Key** que aparece no dashboard
4. Cola-a em `config.php` no lugar de `A_TUA_CHAVE_AQUI`

---

## PASSO 3 — Recuperação de Senha por Email (Gmail)

Para que os emails de recuperação de senha sejam enviados de verdade:

### 3.1 — Ativar verificação em dois passos no Gmail
1. Vai a **https://myaccount.google.com**
2. Clica em **Segurança** (coluna da esquerda)
3. Em "Como inicias sessão no Google", clica em **Verificação em dois passos**
4. Segue os passos para ativar

### 3.2 — Criar uma App Password
1. Ainda em **Segurança**, procura **Passwords de aplicações** (ou "App passwords")
   - Se não aparecer: usa a barra de pesquisa da página e escreve "app passwords"
2. Clica em **Passwords de aplicações**
3. Em "Selecionar aplicação" escolhe **Correio** (Mail)
4. Em "Selecionar dispositivo" escolhe **Outro** → escreve "Weather App"
5. Clica em **Gerar**
6. Aparece uma password de **16 caracteres** (ex: `abcd efgh ijkl mnop`)
7. Copia essa password para o `MAIL_PASS` em `config.php` (com ou sem espaços)

### 3.3 — Preencher config.php
```php
define('MAIL_USER', 'o_teu_email@gmail.com');   // o teu Gmail real
define('MAIL_PASS', 'abcd efgh ijkl mnop');      // App Password gerada
define('MAIL_FROM', 'o_teu_email@gmail.com');    // igual ao MAIL_USER
```

### ⚠️ Sem email configurado (desenvolvimento local)
O código de recuperação é guardado automaticamente em:
```
backend/logs/emails.log
```
Abre esse ficheiro, copia o código de 6 dígitos e usa-o na página de recuperação de senha.

---

## PASSO 4 — Base de dados

Abre o phpMyAdmin (http://localhost/phpmyadmin) e corre o script SQL:
```
database/schema.sql
```

Ou pelo CMD:
```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root -p < database\schema.sql
```

---

## PASSO 5 — Arrancar o servidor

Dois CMDs em simultâneo:

**CMD 1 — Backend:**
```cmd
"C:\xampp\php\php.exe" -S localhost:8000 -t "C:\caminho\para\proj\backend"
```

**CMD 2 — Frontend:**
```cmd
cd "C:\caminho\para\proj\frontend"
npm install
npx ng serve
```

Abre o browser em **http://localhost:4200**
