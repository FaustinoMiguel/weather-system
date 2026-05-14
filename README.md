<!-- Decisão técnica: este README documenta execução local e o fluxo Git pedido sem guardar segredos no repositório. -->

# Sistema de Previsão do Tempo

Projecto full-stack para Engenharia de Software II, com frontend Angular, backend PHP puro, MySQL/MariaDB, autenticação JWT, favoritos, histórico, exportação CSV/PDF, i18n PT/EN, tema claro/escuro e integração com Open-Meteo.

## Requisitos locais

- PHP 8.1 ou superior, com PDO MySQL activo.
- MySQL ou MariaDB.
- Node.js com npm.
- Acesso à internet para consultar a API pública da Open-Meteo, que não exige chave para este uso básico.

## Como executar

1. Importa `database/schema.sql` numa base MySQL/MariaDB.
2. Copia `backend/config/config.example.php` para `backend/config/config.php` e preenche credenciais reais.
3. Serve o backend com PHP:

```bash
php -S localhost:8000 -t backend
```

4. Instala dependências do frontend e executa Angular:

```bash
cd frontend
npm install
npm start
```

5. Abre `http://localhost:4200`.

## Comandos Git por etapa

```bash
git init
git config user.name "O teu nome"
git config user.email "o_teu_email@exemplo.com"
git add .
git commit -m "chore: add database schema, gitignore and config template"

git checkout -b feature/auth
git add .
git commit -m "feat(auth): implement register, login, logout and password recovery"
git push origin feature/auth

git checkout -b feature/weather
git add .
git commit -m "feat(weather): integrate Open-Meteo API for current and forecast data"
git push origin feature/weather

git checkout -b feature/favourites
git add .
git commit -m "feat(favourites): add CRUD for favourite cities and search history"
git push origin feature/favourites

git checkout -b feature/frontend-setup
git add .
git commit -m "chore(frontend): setup Angular project structure with routing and AuthGuard"
git push origin feature/frontend-setup

git checkout -b feature/auth-ui
git add .
git commit -m "feat(auth): add login, register and forgot-password components"
git push origin feature/auth-ui

git checkout -b feature/weather-ui
git add .
git commit -m "feat(weather): implement weather search dashboard with 5-day forecast"
git push origin feature/weather-ui

git checkout -b feature/favourites-history-compare
git add .
git commit -m "feat(favourites): add favourite cities, search history and city comparison"
git push origin feature/favourites-history-compare

git checkout -b feature/export
git add .
git commit -m "feat(export): implement CSV and PDF export for weather reports"
git push origin feature/export

git checkout -b feature/i18n-dark-mode
git add .
git commit -m "feat(i18n): add Portuguese and English support with dark/light mode toggle"
git push origin feature/i18n-dark-mode

git checkout main
git merge feature/auth
git merge feature/weather
git merge feature/favourites
git merge feature/frontend-setup
git merge feature/auth-ui
git merge feature/weather-ui
git merge feature/favourites-history-compare
git merge feature/export
git merge feature/i18n-dark-mode
git push origin main
```

## Repositório remoto

```bash
git remote add origin https://github.com/teu-utilizador/weather-system.git
git branch -M main
git push -u origin main
```
