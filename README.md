# LinguaAI — Multilingual Translator with Voice

React/Vite frontend + FastAPI backend using Azure AI.

## Features
- Type multilingual text and translate to English
- Multi-select possible input languages, including Saraiki
- Browser microphone voice input
- English text-to-speech with Listen/Stop
- Roman Urdu spelling variation support
- Copy, clear, examples, responsive UI

## Run backend

From project root:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` in the project root with only:

```env
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.services.ai.azure.com/api/projects/YOUR-PROJECT
```

Deployment is hardcoded in `backend/app/config.py`:

```python
AZURE_OPENAI_DEPLOYMENT = "gpt-5.6-sol"
```

Authenticate:

```bash
az login
```

Run from project root:

```bash
uvicorn backend.app.main:app --reload
```

## Run frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## Voice

For best browser support, use Chrome or Microsoft Edge.

1. Select the language you will speak.
2. Click **Speak**.
3. Allow microphone permission.
4. Speak.
5. Click **Stop**.
6. Click **Translate**.
7. Click **Listen** to hear the English result.

If multiple languages are selected, voice recognition uses the first selected language as the browser hint.

Roman Urdu is mapped to `ur-PK`. Saraiki is available as a typed input language and is passed to Azure as a language hint; browser voice recognition for Saraiki depends on browser speech-service support. browser speech recognition can produce Urdu script or another best-available transcription. The AI translator then converts the resulting text to English.

No extra voice API is required.
