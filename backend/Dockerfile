FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
# CPU-only torch first: the default wheel bundles CUDA libraries that
# blow past Render's 512Mi free-tier limit just on import.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
# Pre-download sentence-transformers model so first request is instant
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
COPY . .
EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
