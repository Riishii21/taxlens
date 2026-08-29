from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import get_settings
from app.logging_setup import configure_logging

configure_logging(get_settings().log_level)

app = FastAPI(title="TaxLens API", version="0.1.0",
              description="Independent prototype. Not a government service. Synthetic data only.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router)


@app.get("/")
def root():
    return {"service": "TaxLens", "disclaimer": "Independent prototype. Synthetic data only."}
