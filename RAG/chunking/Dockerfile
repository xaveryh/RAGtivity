FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN pip install fastapi uvicorn langchain langchain-community beautifulsoup4

EXPOSE 8001

CMD ["uvicorn", "document_loader_service:app", "--host", "0.0.0.0", "--port", "8001"]
