FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN pip install fastapi uvicorn langchain langchain-community langchain-huggingface python-multipart sentence-transformers pypdf

CMD ["uvicorn", "document_loader:app", "--host", "0.0.0.0", "--port", "8001"]
