import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from pydantic import BaseModel, Field

from .config import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT

load_dotenv()

app = FastAPI(title="Multilingual to English Translator", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """
You are an expert multilingual-to-English translator.

Translate the user's input into natural, fluent, grammatically correct
modern English.

The input may be any language selected by the user, including Roman Urdu,
Urdu, Saraiki, Hindi, Arabic, Spanish, French, German, Chinese, Turkish, Italian,
Portuguese, Japanese, Korean, Russian, or mixed languages.

Rules:
1. Understand meaning from context.
2. Do not translate word-for-word when unnatural.
3. Preserve meaning, tense, intent, politeness, uncertainty, names,
   numbers, and technical terms.
4. Do not invent information.
5. Do not assume gender when unspecified.
6. Correct grammar, punctuation, sentence structure, tense, articles,
   prepositions, and word order.
7. Understand Roman Urdu spelling variations such as:
   mujhe/mjhy/mjy/muje/mujhy, nahi/nhi/ni/nai, karna/krna,
   kyun/q, aap/ap, ke/k, hai/hy, hoon/hun.
8. Saraiki may be written in Arabic/Perso-Arabic script or informal Romanized form. Understand regional vocabulary and context.
9. Mixed-language input is allowed.
10. Preserve the intended tone.
11. Return ONLY the final English translation. No explanation.
"""

class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    languages: list[str] = Field(default_factory=list)

class TranslationResponse(BaseModel):
    english: str

def get_openai_client():
    if not AZURE_OPENAI_ENDPOINT:
        raise RuntimeError("AZURE_OPENAI_ENDPOINT is missing from .env")
    project = AIProjectClient(
        endpoint=AZURE_OPENAI_ENDPOINT,
        credential=DefaultAzureCredential(),
    )
    return project.get_openai_client()

@app.get("/svc/api/health")
def health():
    return {
        "status": "ok",
        "project_endpoint_configured": bool(AZURE_OPENAI_ENDPOINT),
        "deployment": AZURE_OPENAI_DEPLOYMENT,
    }

@app.post("/svc/api/translate", response_model=TranslationResponse)
def translate(request: TranslationRequest):
    try:
        client = get_openai_client()
        if request.languages:
            language_info = (
                "Possible input languages selected by the user: "
                + ", ".join(request.languages)
                + ". Use them as hints, but prioritize the actual text.\n\n"
            )
        else:
            language_info = (
                "Detect the input language from the text and translate it "
                "to English.\n\n"
            )

        response = client.responses.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            instructions=SYSTEM_PROMPT,
            input=language_info + "Input text:\n" + request.text,
        )

        translation = response.output_text.strip()
        if not translation:
            raise HTTPException(
                status_code=502,
                detail="Azure returned an empty translation.",
            )
        return TranslationResponse(english=translation)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Translation error: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Translation failed: {str(e)}",
        )
