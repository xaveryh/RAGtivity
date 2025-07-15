import os
import numpy as np
from typing import List
from docling.document_converter import DocumentConverter
from src.impl import Datastore
from .dataitem import DataItem
import nltk
nltk.download('punkt_tab')
from nltk.tokenize import sent_tokenize

class Indexer:
    def __init__(self, datastore):
        self.converter = DocumentConverter()
        self.datastore = datastore 
        os.environ["TOKENIZERS_PARALLELISM"] = "false" # Disable tokenizers parallelism to avoid OOM errors.

    def index(self, document_paths: List[str]) -> List[DataItem]:
        all_items = []  # Collect items from all documents
        
        for document_path in document_paths:
            document = self.converter.convert(document_path)
            markdown_text = document.document.export_to_markdown()
            sentences = sent_tokenize(markdown_text)
            embeddings = [self.datastore.get_embedding(sentence) for sentence in sentences]  # Use instance method
            print(f"Generated {len(embeddings)} sentence embeddings.")

            similarities = [self.cosine_similarity(embeddings[i], embeddings[i + 1]) for i in range(len(embeddings) - 1)] 
            breakpoints = self.compute_breakpoints(similarities, method="percentile", threshold=90) 

            # Create chunks using the split_into_chunks function, passing the document path as source
            items = self.split_into_chunks(sentences, breakpoints, source_path=document_path)

            # Print the number of chunks created
            print(f"Number of semantic chunks: {len(items)}") 
            
            all_items.extend(items)  # Add items from this document to the collection

        return all_items  
  

    def cosine_similarity(self,vec1, vec2):
        """
        Computes cosine similarity between two vectors.

        Args:
        vec1 (np.ndarray): First vector.
        vec2 (np.ndarray): Second vector.

        Returns:
        float: Cosine similarity.
        """
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
    

    def compute_breakpoints(self,similarities, method="percentile", threshold=90):
        """
        Computes chunking breakpoints based on similarity drops.

        Args:
        similarities (List[float]): List of similarity scores between sentences.
        method (str): 'percentile', 'standard_deviation', or 'interquartile'.
        threshold (float): Threshold value (percentile for 'percentile', std devs for 'standard_deviation').

        Returns:
        List[int]: Indices where chunk splits should occur.
        """
        # Determine the threshold value based on the selected method
        if method == "percentile":
            # Calculate the Xth percentile of the similarity scores
            threshold_value = np.percentile(similarities, threshold)
        elif method == "standard_deviation":
            # Calculate the mean and standard deviation of the similarity scores
            mean = np.mean(similarities)
            std_dev = np.std(similarities)
            # Set the threshold value to mean minus X standard deviations
            threshold_value = mean - (threshold * std_dev)
        elif method == "interquartile":
            # Calculate the first and third quartiles (Q1 and Q3)
            q1, q3 = np.percentile(similarities, [25, 75])
            # Set the threshold value using the IQR rule for outliers
            threshold_value = q1 - 1.5 * (q3 - q1)
        else:
            # Raise an error if an invalid method is provided
            raise ValueError("Invalid method. Choose 'percentile', 'standard_deviation', or 'interquartile'.")

        # Identify indices where similarity drops below the threshold value
        return [i for i, sim in enumerate(similarities) if sim < threshold_value]
    
    
    def split_into_chunks(self, sentences, breakpoints, source_path=""):
        """
        Splits sentences into semantic chunks and returns DataItem objects.

        Args:
        sentences (List[str]): List of sentences.
        breakpoints (List[int]): Indices where chunking should occur.
        source_path (str): Path to the source document.

        Returns:
        List[DataItem]: List of DataItem objects with content and source.
        """
        chunks = []  # Initialize an empty list to store the chunks
        start = 0  # Initialize the start index

        # Iterate through each breakpoint to create chunks
        for bp in breakpoints:
            # Create chunk content from sentences
            chunk_content = ". ".join(sentences[start:bp + 1]) + "."
            # Create DataItem object
            data_item = DataItem(content=chunk_content, source=source_path)
            chunks.append(data_item)
            start = bp + 1  # Update the start index to the next sentence after the breakpoint

        # Append the remaining sentences as the last chunk
        if start < len(sentences):
            chunk_content = ". ".join(sentences[start:]) + "."
            data_item = DataItem(content=chunk_content, source=source_path)
            chunks.append(data_item)
        
        return chunks  # Return the list of DataItem objects



