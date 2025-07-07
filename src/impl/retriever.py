from src.interface.base_datastore import BaseDatastore
from src.interface.base_retriever import BaseRetriever


class Retriever(BaseRetriever):
    def __init__(self, datastore: BaseDatastore):
        self.datastore = datastore

    def search(self, query: str, top_k: int = 3) -> list[str]:
        # Direct search without reranking
        search_results = self.datastore.search(query, top_k=top_k)
        print(f"✅ Retrieved {len(search_results)} results")
        return search_results