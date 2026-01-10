from langchain.tools import tool, ToolRuntime
from dataclasses import dataclass
from pymongo import MongoClient
from langchain_google_genai import GoogleGenerativeAIEmbeddings

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", output_dimensionality=768)

@dataclass
class LangchainRuntimeContext:
    mongoClient: MongoClient
    userId: str

@tool(response_format="content_and_artifact")
def retrieve_context(query: str, runtime: ToolRuntime[LangchainRuntimeContext]):
    """Retrieve information to help answer a query."""
    # Get query's embeddings
    query_embeddings = embeddings.embed_documents([query])
    # Vector search criteria for MongoDB
    vectorSearchCriteria = {
        "$vectorSearch": {
            "index": "vectorChunkIndex",
            "path": "embeddings",
            "queryVector": query_embeddings[0], # [0] to remove extra dimension
            "numCandidates": 100, # MongoDB recommends this value to be `limit * 20`
            "limit": 5,
            # Only search chunks that corresponds to the user
            "$filter": {
                "userId": {
                    "$eq": runtime.context.userId
                }
            }
        }
    }

    # Get the Mongo client from runtime context
    mongoClient = runtime.context.mongoClient
    # Get the vector search retrieval results 
    results = mongoClient["ragtivity"]["chunked_documents"].aggregate([vectorSearchCriteria])

    serialized = "\n\n".join(
        f"Source: {doc["filename"]} \nContent: {doc["text"]}"
        for doc in results
    )

    return serialized, results
