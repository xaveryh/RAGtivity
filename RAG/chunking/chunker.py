from fastapi import FastAPI
from pydantic import BaseModel
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import embeddings
from database import vector_store

app = FastAPI(title="Document Loader Service")

class LoadRequest(BaseModel):
    filepath: str

def split_and_store(docs):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        add_start_index=True
    )
    splits = splitter.split_documents(docs)
    vector_store.add_documents(splits)

@app.post("/load/pdf")
def load_pdf(req: LoadRequest):
    docs = PyPDFLoader(req.filepath).load()
    split_and_store(docs)
    return {"status": "ok", "chunks": len(docs)}
