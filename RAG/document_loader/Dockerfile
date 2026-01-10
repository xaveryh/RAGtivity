FROM python:3.11-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    python-multipart \
    pypdf \
    langchain-text-splitters \
    langchain-google-genai \
    langchain-community \
    python-dotenv

CMD ["uvicorn", "document_loader:app", "--host", "0.0.0.0", "--port", "8001"]
