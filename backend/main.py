import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from database import create_db_and_tables
from api.notebooks import router as notebooks_router
from api.sources import router as sources_router
from api.chat import router as chat_router

load_dotenv()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="NotebookLM Clone API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://notebook-lm-clone-918h.vercel.app","http://localhost:5173"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notebooks_router, prefix="/api")
app.include_router(sources_router, prefix="/api")
app.include_router(chat_router, prefix="/api")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok"}
