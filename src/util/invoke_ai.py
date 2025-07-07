from transformers import T5Tokenizer, T5ForConditionalGeneration

def invoke_ai(system_message: str, user_message: str) -> str:
    """
    Generic function to invoke an AI model given a system and user message.
    """
    # Combine everything into a single prompt
    full_prompt = f"{system_message}\n\n{user_message}"

    # Load tokenizer and model
    tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-small")
    model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-small", device_map="auto")

    input_ids = tokenizer(full_prompt, return_tensors="pt").input_ids.to("cuda")
    outputs = model.generate(input_ids, max_new_tokens=1000,do_sample=False,early_stopping=False)
    answer = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return answer