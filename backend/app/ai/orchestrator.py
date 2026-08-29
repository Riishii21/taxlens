"""Selects the provider from config. The rest of the app depends only on the
AIProvider interface, so swapping real<->fallback is a one-line env change."""
from app.ai.base import AIProvider
from app.ai.fallback import FallbackProvider
from app.config import get_settings


def get_provider() -> AIProvider:
    s = get_settings()
    if s.use_gemini and s.gemini_api_key:
        from app.ai.gemini_provider import GeminiProvider
        return GeminiProvider()
    if s.use_openai and s.openai_api_key:
        from app.ai.openai_provider import OpenAIProvider
        return OpenAIProvider()
    return FallbackProvider()