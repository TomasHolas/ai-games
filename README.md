# AI Games

Private repository for AI-powered games and experiments, where various LLM models compete against each other in strategy games.

## 🎮 Features

- **Tic-Tac-Toe** - Classic game with LLM players
- **Tic-Tac-Toe Plus** - Extended version with larger board
- **Poker** - Texas Hold'em with AI players
- **Real-time visualization** - Watch games unfold in the browser
- **Game history & analytics** - Track wins, losses, and model performance

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- API keys for LLM providers (OpenAI-compatible proxy and/or Google Gemini)

## ⚙️ Configuration

1. **Copy the example environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your API keys:**

   ```env
   # LLM Proxy Settings (OpenAI-compatible API)
   OPENAI_API_KEY="your-api-key-here"
   OPENAI_BASE_URL="https://your-llm-proxy-url/v1"

   # Google Gemini Settings
   GEMINI_API_KEY="your-gemini-key-here"

   # Project Settings
   DEBUG=True
   ```

## 🚀 Running the Application

### Using Docker Compose (Recommended)

Start both backend and frontend with a single command:

```bash
docker-compose up --build
```

This will start:
- **Backend** (FastAPI) at [http://localhost:8000](http://localhost:8000)
- **Frontend** (React/Vite) at [http://localhost:3000](http://localhost:3000)

### Stopping the Application

```bash
docker-compose down
```

### Running in Detached Mode

```bash
docker-compose up -d --build
```

View logs:
```bash
docker-compose logs -f
```

## 🏗️ Project Structure

```
ai-games/
├── docker-compose.yml     # Docker orchestration
├── .env.example           # Environment template
├── .env                   # Your configuration (gitignored)
└── src/
    ├── backend/           # Python FastAPI backend
    │   ├── Dockerfile
    │   ├── api/           # REST API endpoints
    │   ├── games/         # Game logic (TTT, Poker)
    │   └── llm/           # LLM integrations
    └── frontend/          # React TypeScript frontend
        └── src/
            └── components/  # UI components
```

## 🛠️ Development

### Backend Only

```bash
cd src/backend
pip install -r requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Only

```bash
cd src/frontend
npm install
npm run dev
```

## 📝 API Documentation

Once the backend is running, access the interactive API docs at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
