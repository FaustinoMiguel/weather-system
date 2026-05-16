# 🌤 Weather App — Sistema de Previsão do Tempo

**Engenharia de Software II — ISPTEC 2025/2026**

Aplicação full-stack de previsão meteorológica com Angular (frontend) e PHP puro (backend), usando a API gratuita [Open-Meteo](https://open-meteo.com) (sem chave de API necessária).

---

## Stack Tecnológica

| Camada       | Tecnologia              |
|--------------|-------------------------|
| Frontend     | Angular 18 (standalone) |
| Backend      | PHP 8.2+ (sem frameworks) |
| Base de dados| MySQL / MariaDB         |
| API Meteo    | Open-Meteo (gratuita)   |
| Auth         | JWT (implementação manual) |

---

## Pré-requisitos

- PHP 8.2+, MySQL 8+ / MariaDB 10.6+
- Node.js 20+, Angular CLI 18+

---

## Instalação

### 1. Base de dados
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend — configuração
```bash
cp backend/config/config.example.php backend/config/config.php
# Editar config.php com credenciais MySQL e secret JWT
```

### 3. Backend — servidor de desenvolvimento
```bash
cd backend
php -S localhost:8000
```

### 4. Frontend
```bash
cd frontend
npm install
ng serve   # http://localhost:4200
```

---

## Funcionalidades

- **Autenticação** — registo, login, logout, recuperação de senha via email, JWT stateless
- **Previsão atual** — temperatura, humidade, vento, pressão, índice UV, nebulosidade
- **Previsão 7 dias** — diária com ícones e precipitação
- **Pesquisa por GPS** — localização automática do browser
- **Favoritos** — guardar e gerir cidades favoritas por utilizador
- **Histórico** — registo automático de todas as pesquisas
- **Comparação** — duas cidades lado a lado em simultâneo
- **Alertas visuais** — condições meteorológicas extremas destacadas
- **Exportação CSV** — histórico completo compatível com Excel
- **Exportação PDF** — relatório meteorológico detalhado
- **i18n** — Português e Inglês, troca sem recarregar a página
- **Dark mode** — modo claro/escuro com preferência persistida

---

## Estrutura de Commits (Conventional Commits)

```
chore: add database schema, gitignore and config template
feat(auth): implement register, login, logout and password recovery
feat(weather): integrate Open-Meteo API for current and forecast data
feat(favourites): add CRUD for favourite cities and search history
chore(frontend): setup Angular project structure with routing and AuthGuard
feat(auth): add login, register and forgot-password components
feat(weather): implement weather search dashboard with 7-day forecast
feat(favourites): add favourite cities, search history and city comparison
feat(export): implement CSV and PDF export for weather reports
feat(i18n): add Portuguese and English support with dark/light mode toggle
```

---

## API Endpoints

| Método | Rota                    | Auth | Descrição               |
|--------|-------------------------|------|-------------------------|
| POST   | /auth/register          | Não  | Registo                 |
| POST   | /auth/login             | Não  | Login                   |
| POST   | /auth/logout            | Sim  | Logout                  |
| POST   | /auth/forgot-password   | Não  | Pedido de recuperação   |
| POST   | /auth/reset-password    | Não  | Redefinição de senha    |
| GET    | /weather/search?city=   | Sim  | Tempo atual             |
| GET    | /weather/forecast?city= | Sim  | Previsão 7 dias         |
| GET    | /weather/coords?lat=&lon=| Sim | Pesquisa por GPS        |
| GET    | /weather/compare?city1=&city2= | Sim | Comparar cidades |
| GET    | /favourites             | Sim  | Listar favoritos        |
| POST   | /favourites             | Sim  | Adicionar favorito      |
| DELETE | /favourites/{id}        | Sim  | Remover favorito        |
| GET    | /history                | Sim  | Listar histórico        |
| DELETE | /history                | Sim  | Limpar histórico        |
| GET    | /export/csv             | Sim  | Exportar CSV            |
| GET    | /export/pdf             | Sim  | Exportar PDF            |

---

## Dados Open-Meteo

A API [Open-Meteo](https://open-meteo.com) é **100% gratuita e sem registo**. Inclui:
- Geocodificação por nome de cidade
- Dados atuais: temperatura, humidade, vento, pressão, UV, precipitação, nebulosidade
- Previsão até 7 dias com códigos WMO para condições meteorológicas

> Dados fornecidos por Open-Meteo.com — licença CC BY 4.0
