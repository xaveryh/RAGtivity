from typing import List
import numpy as np
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from shared.dataitem import DataItem


class DatastoreRequest(BaseModel):
    item: DataItem

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

    def add_item(self, item) -> None:
        """
        Add a DataItem to the datastore.
        
        Parameters:
            item: DataItem
        """
        try:
            embedding = requests.post(
                "http://embedding_model:8000/",
                json={"contents": [item.content]}
                )

            self.filenames.append(item.filename)
        except Exception as e:
            print("Error while adding item to datastore: ", e)
        embed = embedding.json()["embeddings"]
        self.embeddings.append(embed)
        self.contents.append(item.content)

    def search(self, query: str, top_k: int = 3) -> List[str]:
        """Search for similar content using cosine similarity."""
        if not self.embeddings:
            return []
        
        query_embedding = self.get_embedding(query)
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
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))


app = FastAPI()
datastore = None

@app.on_event("startup")
def startup():
    global datastore
    datastore = Datastore()

@app.post("/")
def store(request: DatastoreRequest):
    item = request.item

    try:
        datastore.add_item(item)
    except Exception as e:
        return {"Error": e}

    return {"Response": "200 OK"}