from typing import List
import numpy as np
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from shared.dataitem import DataItem

class Datastore:

    def __init__(self):
        self.embeddings = []  # List of vectors
        self.contents = []    # List of content strings
        self.filenames = []     # List of filename strings

    def reset(self):
        """Clear all stored data."""
        self.embeddings = []
        self.contents = []
        self.filenames = []
        print("✅ Datastore reset - all data cleared")

    def add_items(self, items) -> None:
        """
        Add list of DataItem to the datastore.
        
        Parameters:
            items: List[DataItem]
        """
        for item in items:
            response = requests.post(
                "http://embedding_model:8000/",
                json=[item.content]
                )

            if not response.ok:
                raise Exception(f"Error while adding item to datastore. Response code: {response.status_code}. {response.text}")

            self.filenames.append(item.filename)
            embeddings = response.json()
            self.embeddings.append(embeddings)
            self.contents.append(item.content)
            

    def search(self, query: str, top_k: int = 3) -> List[str]:
        """Search for similar content using cosine similarity."""
        # Check if there is anything in the datastore
        if not self.embeddings:
            return []
        
        # Encode query
        response = requests.post(
            "http://embedding_model:8000",
            json=[query]
        )
        if not response.ok:
            raise Exception(f"Something went wrong when encoding user query. Response status: {response.status_code}. {response.text}")
        query_embedding = response.json()
        
        similarities = []
        # Calculate cosine similarity with all stored embeddings
        for stored_embedding in self.embeddings:
            similarity = self._cosine_similarity(query_embedding, stored_embedding)
            similarities.append(similarity)
        
        # Get top_k most similar items
        top_indices = np.argsort(similarities)[-top_k:][::-1]  # Sort descending
        result_content = [self.contents[i] for i in top_indices]
        
        return result_content

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
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
def search(query: str) -> List[str]:
    contents = datastore.search(query)
    return contents