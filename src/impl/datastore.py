from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
from src.interface.base_datastore import BaseDatastore, DataItem


class Datastore(BaseDatastore):

    def __init__(self):
        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device='cpu')
        self.embeddings = []  # List of vectors
        self.contents = []    # List of content strings
        self.sources = []     # List of source strings

    def reset(self):
        """Clear all stored data."""
        self.embeddings = []
        self.contents = []
        self.sources = []
        print("✅ Datastore reset - all data cleared")

    def get_embedding(self, content: str) -> List[float]:
        """Generate embedding for a piece of content."""
        embedding = self.model.encode(content, convert_to_numpy=True)
        return embedding.tolist()

    def add_items(self, items: List[DataItem]) -> None:
        """Add items to the datastore."""
        for item in items:
            embedding = self.get_embedding(item.content)
            self.embeddings.append(embedding)
            self.contents.append(item.content)
            self.sources.append(item.source)
            
        print(f"✅ Added {len(items)} items to datastore. Total items: {len(self.contents)}")

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