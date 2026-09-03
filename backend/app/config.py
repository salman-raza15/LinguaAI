import os
from dotenv import load_dotenv

load_dotenv()

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip()

# Keep deployment name here, NOT in .env
AZURE_OPENAI_DEPLOYMENT = "gpt-5.6-sol"
