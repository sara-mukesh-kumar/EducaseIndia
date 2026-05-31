# 🐙 GitHub Profile Analyzer API

A Node.js + Express backend service that fetches public GitHub user profiles via the GitHub REST API, analyzes repository insights, and stores the results in a MySQL database.

---

## 🚀 Features

- **Analyze any GitHub username** — fetches profile + all public repos in one call
- **Rich insights stored in MySQL** — followers, stars, top languages, top repos, forks, gists, and more
- **Full CRUD** — analyze, read (list/single), and delete profiles
- **Search & Pagination** — query stored profiles by username or name
- **Aggregate Stats** — summary endpoint with leaderboards and language distribution
- **Rate limiting & security** — Helmet, CORS, express-rate-limit out of the box
- **GitHub token support** — optional token raises API limit from 60 → 5000 req/hour

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL 8+ |
| HTTP client | Axios |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |

---

## 📋 Prerequisites

- Node.js v18+
- MySQL 8.0+
- (Optional) GitHub Personal Access Token

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/github-profile-analyzer.git
cd github-profile-analyzer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer

# Optional but recommended — raises GitHub API limit to 5000 req/hr
GITHUB_TOKEN=ghp_your_token_here
```

### 4. Create the MySQL database

```bash
mysql -u root -p < docs/schema.sql
```

Or manually in MySQL:

```sql
CREATE DATABASE github_analyzer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> The app auto-creates tables on first startup.

### 5. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:3000`

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000
```

---

### `GET /`
Returns API info and available routes.

---

### `GET /health`
Health check endpoint.

**Response:**
```json
{ "success": true, "status": "OK", "timestamp": "2025-01-01T00:00:00.000Z" }
```

---

### `POST /api/profiles/analyze/:username`
Fetches the GitHub profile + all public repos for `:username`, analyzes them, and stores/updates the result in MySQL.

**Example:**
```bash
curl -X POST http://localhost:3000/api/profiles/analyze/torvalds
```

**Response:**
```json
{
  "success": true,
  "message": "Profile for \"torvalds\" analyzed and stored successfully",
  "data": {
    "id": 1,
    "username": "torvalds",
    "name": "Linus Torvalds",
    "followers": 240000,
    "public_repos": 8,
    "total_stars": 210000,
    "most_used_language": "C",
    "top_languages": { "C": 5, "Perl": 2 },
    "top_repos": [ ... ],
    ...
  }
}
```

---

### `GET /api/profiles`
Returns all stored profiles with pagination and optional search.

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `10` | Results per page (max 100) |
| `search` | `""` | Filter by username or name |

**Example:**
```bash
curl "http://localhost:3000/api/profiles?page=1&limit=5&search=linux"
```

---

### `GET /api/profiles/:username`
Returns full stored analysis for a single username.

**Example:**
```bash
curl http://localhost:3000/api/profiles/torvalds
```

---

### `GET /api/profiles/stats/summary`
Returns aggregate statistics across all stored profiles.

**Response includes:**
- Total profiles analyzed
- Average followers & repos
- Top 5 profiles by followers
- Top 5 profiles by total stars
- Language distribution

---

### `DELETE /api/profiles/:username`
Deletes a stored profile and its repo insights.

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/profiles/torvalds
```

---

## 🗄️ Database Schema

Three tables are used:

### `github_profiles`
Core profile data mirrored from GitHub API.

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto-increment |
| username | VARCHAR(255) UNIQUE | GitHub login |
| name | VARCHAR(255) | Display name |
| bio | TEXT | Profile bio |
| avatar_url | VARCHAR(500) | Avatar URL |
| public_repos | INT | Public repo count |
| followers | INT | Follower count |
| following | INT | Following count |
| public_gists | INT | Gist count |
| account_type | VARCHAR(50) | User / Organization |
| is_hireable | BOOLEAN | Hireable flag |
| analyzed_at | DATETIME | Last analysis time |

### `profile_repo_insights`
Derived insights computed from public repos.

| Column | Type | Description |
|--------|------|-------------|
| profile_id | INT FK | → github_profiles.id |
| total_stars | INT | Sum of all repo stars |
| total_forks | INT | Sum of all forks |
| most_used_language | VARCHAR | Top language |
| top_languages | JSON | Language frequency map |
| top_repos | JSON | Top 5 repos by stars |
| avg_repo_size | FLOAT | Average repo size (KB) |
| original_repo_count | INT | Non-forked repos |
| forked_repo_count | INT | Forked repos |

### `analysis_history`
Audit log of all analysis requests.

---

## 📬 Postman Collection

Import `docs/postman_collection.json` into Postman. Set the `baseUrl` variable to your server URL.

---

## 🌐 Deployment Notes (Railway / Render / Fly.io)

1. Set all environment variables in the platform dashboard
2. Set `NODE_ENV=production`
3. Provision a MySQL addon or use PlanetScale / Railway MySQL
4. The app auto-creates tables on startup — no migration step needed

---

## 📁 Project Structure

```
github-profile-analyzer/
├── src/
│   ├── index.js                  # App entry point
│   ├── config/
│   │   └── database.js           # MySQL pool + init
│   ├── controllers/
│   │   └── profileController.js  # Route handlers
│   ├── models/
│   │   ├── profileModel.js       # Profile DB queries
│   │   └── repoInsightsModel.js  # Insights DB queries
│   ├── routes/
│   │   └── profileRoutes.js      # Express router
│   ├── middleware/
│   │   └── errorHandler.js       # Global error handler
│   └── utils/
│       └── githubHelper.js       # GitHub API + analysis logic
├── docs/
│   ├── schema.sql                # Database schema export
│   └── postman_collection.json   # Postman collection
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔐 GitHub Token (Recommended)

Without a token, the GitHub API allows 60 requests/hour per IP. With a token, this raises to 5,000/hour.

1. Go to https://github.com/settings/tokens
2. Generate a new token (classic) with `public_repo` read scope
3. Add it to `.env` as `GITHUB_TOKEN=ghp_...`

---

## 📄 License

MIT
