from fastapi import FastAPI, UploadFile
import tempfile
import shutil
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings

app = FastAPI(title="Document Loader Service")
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-mpnet-base-v2"
)


def split_and_get_embeddings(docs_content):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        add_start_index=True
    )
    # Use split_text() to only return the chunked text array
    splits = splitter.split_text(docs_content)
    # Get the embeddings for each chunk of texts
    text_embeddings = embeddings.embed_documents(splits)
    return splits, text_embeddings


@app.post("/load/pdf")
def load_pdf(file: UploadFile):
    # UploadFile returns a SpooledTemporaryFile, but we need a NamedTemporaryFile 
    with tempfile.NamedTemporaryFile(delete=True) as tmpfile:
        # Copy the `file` object to tmpfile, which is a NamedTemporaryFile
        with open(tmpfile.name, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Open the file
        docs = PyPDFLoader(tmpfile.name).load()
        # PyPDFLoader loads the file and separates them per page. Combine the pages into a single large string of texts for the whole docs content
        docs_content = '\n'.join([d.page_content for d in docs])
        # Chunk and get the text embeddings
        chunked_text, text_embeddings = split_and_get_embeddings(docs_content)
        return {"text": chunked_text, "embeddings": text_embeddings}
