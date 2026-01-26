import os
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()


class Settings:
    # LLM Proxy Settings (OpenAI Compatible)
    # From image: API Host + Base Path
    # Example: https://llm-proxy.ds.trasklab.cz/v1
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL")

    # Google Gemini
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    # App
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"


settings = Settings()
