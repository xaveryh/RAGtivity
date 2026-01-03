FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN pip install fastapi uvicorn langchain langchain-community langchain-huggingface python-multipart sentence-transformers pypdf

EXPOSE 8001

CMD ["uvicorn", "chunker:app", "--host", "0.0.0.0", "--port", "8001"]
