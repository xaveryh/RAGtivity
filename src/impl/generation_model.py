from transformers import T5Tokenizer, T5ForConditionalGeneration, BitsAndBytesConfig
import torch

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

        model_id = "google/flan-t5-small" if model_id is None else model_id
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_storage=torch.float16,
            bnb_4bit_use_double_quant=False
        )
        
        self.tokenizer = T5Tokenizer.from_pretrained(model_id)
        self.model = T5ForConditionalGeneration.from_pretrained(
                model_id,
                device_map={"": 0},
                quantization_config=bnb_config,
                trust_remote_code=True,
                torch_dtype=torch.float16,
                token=""
            )
        self._initialized = True

    def invoke_ai(self, system_message: str, user_message: str) -> str:
        """
        Generic function to invoke an AI model given a system and user message.
        """
        # Combine everything into a single prompt
        full_prompt = f"{system_message}\n\n{user_message}"
        # Send inputs to same device as model
        model_device = next(self.model.parameters()).device
        input_ids = self.tokenizer(full_prompt, return_tensors="pt").input_ids.to(model_device)

        with torch.no_grad():
            outputs = self.model.generate(input_ids)

        answer = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        return answer
