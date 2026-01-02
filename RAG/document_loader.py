
#I PUT THE LOGIC INSIDE CHUNKING FOLDER (just call the API there)

from langchain_community.document_loaders import PyPDFLoader  
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader
from config import embeddings
from database import vector_store
import bs4

class DocumentLoader:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.embedding = embeddings
        self.vector_store = vector_store
    
    def get_vector_store(self):
        return self.vector_store
    
    def _split_and_store(self, docs):
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )
        splits = splitter.split_documents(docs)
        self.vector_store.add_documents(splits)

    def pdf_loader(self):
        docs = PyPDFLoader(self.filepath).load()
        self._split_and_store(docs)
    
    def web_loader(self):
        bs4_strainer = bs4.SoupStrainer(class_=("post-title", "post-header", "post-content"))
        loader = WebBaseLoader(
            web_paths=(self.filepath,),
            bs_kwargs={"parse_only": bs4_strainer},
        )
        docs = loader.load()
        self._split_and_store(docs)
