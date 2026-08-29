from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configuration via environment variables. No secrets in source."""
    model_config = SettingsConfigDict(env_prefix="TAXLENS_", env_file=".env", extra="ignore")

    use_openai: bool = False
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_max_retries: int = 2

    use_gemini: bool = False
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    ai_confidence_threshold: float = 0.55
    log_level: str = "INFO"
    rule_version: str = "2026.08.1"
    store_backend: str = "memory"
    database_url: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()