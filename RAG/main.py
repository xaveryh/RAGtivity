from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents import create_rag_agent
from dataclasses import dataclass
from pymongo import MongoClient
import os
import shutil
import re
import ast
import requests

@dataclass
class LangchainRuntimeContext:
    mongoClient: MongoClient
    userId: str

DOCUMENT_LOADER_URL = "http://document_loader:8001/load/pdf"
UPLOAD_DIR = "/uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = create_rag_agent(LangchainRuntimeContext)

class QueryRequest(BaseModel):
    question: str
    userId: str

@app.on_event("startup")
def app_startup():
    try:
        app.mongo_client = MongoClient(os.getenv("MONGO_URI"))
        app.mongo_client.admin.command("ping")
        print("Connected to MongoDB")
    except Exception as e:
        print("Something went wrong while connecting to MongoDB: " + e)
        raise Exception("Database connection failed")

@app.on_event("shutdown")
def app_shutdown():
    app.mongo_client.close()

@app.get("/")
def root():
    return {"message": "RAG API is running"}


@app.post("/query")
def query_rag(request: QueryRequest):
    response_text = ""
    sources = []

    for event in agent.stream(
        {"messages": [{"role": "user", "content": request.question}]},
        stream_mode="values",
        context=LangchainRuntimeContext(mongoClient=app.mongo_client, userId=request.userId)
    ):
        content = event["messages"][-1].content

        # Extract all Source: {...} blocks
        source_matches = re.findall(r"Source: ({.*?})", content, re.DOTALL)
        for match in source_matches:
            try:
                sources.append(ast.literal_eval(match))
            except Exception:
                pass

        # Remove Source blocks from answer text
        response_text = re.sub(r"Source: ({.*?})", "", content, flags=re.DOTALL).strip()

    return {"answer": response_text, "sources": sources}

#this is the uploading document that call the chunking service
@app.post("/upload")
def upload_document(file: UploadFile = File(...)):
    # Call document loader container
    response = requests.post(
        DOCUMENT_LOADER_URL,
        files={"file": (file.filename, file.file)}
    )

    return response.json()


@app.get("/documents")
def get_documents():
    """
    Retrieve all documents in the vector store along with their chunk counts.
    """
    all_docs = []
    collection_data = vector_store._collection.get()
    ids = collection_data["ids"]
    metadatas = collection_data["metadatas"]

    # Create a dict to count chunks per file
    chunk_counts = {}
    for md in metadatas:
        filename = md.get("filename", "Unknown")
        chunk_counts[filename] = chunk_counts.get(filename, 0) + 1

    # Assign unique numeric ID for frontend
    for idx, filename in enumerate(chunk_counts.keys(), start=1):
        all_docs.append({
            "id": idx,
            "filename": filename,
            "chunks": chunk_counts[filename]
        })

    return {"documents": all_docs}
