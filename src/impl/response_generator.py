from typing import List
from src.interface.base_response_generator import BaseResponseGenerator
from .generation_model import GeneratorModel

SYSTEM_PROMPT = """
Use ONLY the provided <context></context> content to provide a concise answer to the user's question.
If you cannot find the answer in the context, say 'I dont know'. Do not make up information.
"""


class ResponseGenerator(BaseResponseGenerator):
    def generate_response(self, query: str, context: List[str]) -> str:
        """Generate a response using OpenAI's chat completion."""
        # Combine context into a single string
        context_text = "\n".join(context)
        user_message = (
            f"<context>\n{context_text}\n</context>\n"
            f"<question>\n{query}\n</question>"
        )
        generator = GeneratorModel()
        return generator.invoke_ai(system_message=SYSTEM_PROMPT, user_message=user_message)
