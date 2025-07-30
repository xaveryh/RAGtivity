from typing import List
import numpy as np
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from shared.dataitem import DataItem
import chromadb

class Datastore:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path="./chroma_store")
        try:
            self.chroma_client.delete_collection("documents")
        except:
            pass
        self.collection = self.chroma_client.get_or_create_collection(name="documents")

    def reset(self):
        try:
            self.chroma_client.delete_collection("documents")
        except:
            pass  
        self.collection = self.chroma_client.get_or_create_collection(name="documents")
        print("✅ ChromaDB reset - all data cleared")

    def add_items(self, items: List[DataItem]) -> None:
        for i, item in enumerate(items):
            response = requests.post("http://embedding_model:8000/", json=[item.content])
            if not response.ok:
                raise Exception(f"Error while adding item to ChromaDB. Status code: {response.status_code}. {response.text}")

            embeddings = response.json()
            embedding = embeddings[0]
            
            doc_id = f"{item.filename}_{i}" 

            self.collection.add(
                documents=[item.content],
                embeddings=[embedding],
                ids=[doc_id],
                metadatas=[{"filename": item.filename}]
            )

    def search(self, query: str, top_k: int = 3) -> List[dict]:
        response = requests.post("http://embedding_model:8000/", json=[query])
        if not response.ok:
            raise Exception(f"Error while encoding query. Status code: {response.status_code}. {response.text}")
        
        embeddings = response.json()
        query_embedding = embeddings[0] 
        
        all_docs = self.collection.get(include=["documents", "embeddings", "metadatas"])
        
        if not all_docs['documents']:
            return []
        
        similarities = []
        for stored_embedding in all_docs['embeddings']:
            similarity = self._cosine_similarity(query_embedding, stored_embedding)
            similarities.append(similarity)
        
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        result_list = []

        for i in top_indices:
            result_list.append({
                "content": all_docs['documents'][i],
                "filename": all_docs['metadatas'][i]['filename'],
                "chunk_id": all_docs['ids'][i],
                "similarity_score": similarities[i]
            })

        return result_list

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        vec1 = np.squeeze(np.array(vec1))
        vec2 = np.squeeze(np.array(vec2))
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

app = FastAPI()
datastore = None

@app.on_event("startup")
def startup():
    global datastore
    datastore = Datastore()

@app.post("/")
def store(items: List[DataItem]):
    datastore.add_items(items)
    return "Document successfully stored"

@app.get("/")
def search(query: str) -> List[dict]:
    result_list = datastore.search(query)
    return result_list