FROM python:3.10-slim

ENV GEMINI_API_KEY=token_here

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "generator:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]