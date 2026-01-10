from langchain.agents import create_agent
from tools import retrieve_context 
from config import model
from dataclasses import dataclass
from pymongo import MongoClient

@dataclass
class LangchainRuntimeContext:
    mongoClient: MongoClient
    userId: str

def create_rag_agent(LangchainRuntimeContext: LangchainRuntimeContext):
    tools = [retrieve_context]

    system_prompt = (
        "You have access to tools to retrieve context from documents or web pages. "
        "Use them when needed to answer user questions."
    )

    return create_agent(
        model=model,
        tools=tools,
        system_prompt=system_prompt,
        context_schema=LangchainRuntimeContext
    )
