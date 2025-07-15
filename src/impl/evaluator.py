from src.util.extract_xml import extract_xml_tag
from .generation_model import GeneratorModel
from transformers import T5Tokenizer, T5ForConditionalGeneration, BitsAndBytesConfig
import torch


SYSTEM_PROMPT = """
You are an evaluation system that determines whether a generated answer from a large language model is factually supported by the provided context, in relation to the given question.

### Task Instructions:
1. You will receive:
   - A context inside `<context></context>` tags.
   - A question inside `<question></question>` tags.
   - A generated answer inside `<generated_answer></generated_answer>` tags.
2. Your task is to check whether the generated answer is **correct and supported by the context**.
3. If the answer is correct and justified by the context, output `<result>true</result>`.
4. If the answer is incorrect or not supported by the context, output `<result>false</result>`.
5. Always include a justification of your decision inside `<reasoning></reasoning>` tags, explaining your comparison of the generated answer with the context.

### Example 1:
<context>Saturn is the sixth planet from the Sun and is known for its prominent ring system. It is a gas giant like Jupiter.</context>  
<question>What planet is known for having rings?</question>  
<generated_answer>Saturn</generated_answer>  
<result>true</result>  
<reasoning>The context clearly states that Saturn is known for its prominent ring system. The answer "Saturn" accurately reflects the information in the context and correctly answers the question.</reasoning>  

---

### Example 2:
<context>Isaac Newton was an English physicist and mathematician who formulated the laws of motion and universal gravitation. He lived in the 17th century.</context>  
<question>Who developed the theory of relativity?</question>  
<generated_answer>Isaac Newton</generated_answer>  
<result>false</result>  
<reasoning>The context talks about Isaac Newton and his contributions to classical mechanics, not the theory of relativity. The correct answer would be Albert Einstein, which is not supported by the context.</reasoning>

### Now evaluate the following:

"""

HF_TOKEN = ""

class EvaluationResult:
    def __init__(self, question, response, is_correct, reasoning=""):
        self.question = question
        self.response = response
        self.is_correct = is_correct
        self.reasoning = reasoning

# Singleton class
class Evaluator:
    _instance = None

    def __new__(cls, model_id=None):
        if cls._instance == None:
            cls._instance = super(Evaluator, cls).__new__(cls)
        return cls._instance


    def __init__(self, model_id=None):
        if hasattr(self, "model"):
            return

        model_id = "google/flan-t5-small" if model_id is None else model_id
        
        self.tokenizer = T5Tokenizer.from_pretrained(model_id)
        self.model = T5ForConditionalGeneration.from_pretrained(
                model_id,
                device_map={"": 0},
                # quantization_config=bnb_config,
                trust_remote_code=True,
                torch_dtype=torch.float16,
                token=HF_TOKEN
            )

    def evaluate(
        self, query: str, response: str, actual_answer: str, datastore
    ) -> EvaluationResult:

        # Get the context
        context = datastore.search(query)
        context = "\n".join(context)
        # Prompt for the evaluator. Will be appended onto the system prompt
        prompt = f"""
        <context>\n{context}\n</context>
        <question>\n{query}\n</question>
        <generated_answer>\n{response}\n</generated_answer>
        <result>
        """
        
        # Get evaluation response
        evaluation = self.prompt(SYSTEM_PROMPT + prompt)

        # Get reasoning and result
        reasoning = extract_xml_tag(evaluation, "reasoning")
        result = extract_xml_tag(evaluation, "result")

        if result is not None:
            is_correct = result.lower() == "true"
        else:
            is_correct = False
            reasoning = f"No result found: ({evaluation})"
        return EvaluationResult(
            question=query,
            response=response,
            is_correct=is_correct,
            reasoning=reasoning,
        )
    

    def prompt(self, prompt):
        # Get device. Could be on cpu or cuda
        model_device = next(self.model.parameters()).device

        # Tokenize prompt into ids
        input_ids = self.tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True).input_ids.to(model_device)

        # Get evaluator output
        with torch.no_grad():
            outputs = self.model.generate(input_ids)

        # Decode output
        decoded_output = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        return decoded_output

