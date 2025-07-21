from google import genai
import os
from fastapi import FastAPI

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

SYSTEM_PROMPT = """
Use ONLY the provided <context></context> content to provide a concise answer to the user's question.
If you cannot find the answer in the context, say 'I do not have enough information in my knowledge base to answer your query'. Do not make up information.
"""

# Singleton class
class GeneratorModel:
    _instance = None

    def __new__(cls, model_id=None):
        if cls._instance is None:
            cls._instance = super(GeneratorModel, cls).__new__(cls)
        return cls._instance

    def __init__(self, model_id=None):
        if hasattr(self, "_initialized") and self._initialized:
            return

        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self._initialized = True

    def invoke_ai(self, prompt: str) -> str:
        """
        Generic function to invoke an AI model given a system and user message.
        """
        full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"
   
        # Send inputs to same device as model
        print("Invoking Gemini...")
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt
        )

        answer = response.text
        return answer


app = FastAPI()
generator = None

@app.on_event("startup")
def startup():
    global generator
    generator = GeneratorModel()

@app.get("/")
def prompt(prompt: str):
    answer = generator.invoke_ai(prompt)
    return answer