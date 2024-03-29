from fastapi import FastAPI
from pydantic import BaseModel
import torch
from transformers import DistilBertTokenizer
from pytorch_modules import inference_utils, config
from typing import List


app = FastAPI()
model = inference_utils.load_model(config.MODEL_DIR)
tokenizer = DistilBertTokenizer.from_pretrained(config.TOKENIZER_DIR, truncation=True, do_lower_case=True)
class_names = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
class_mapping = {index: class_name for index, class_name in enumerate(class_names)}

class TextInput(BaseModel):
    text: str

class SentimentOutput(BaseModel):
    sentiment: List[str]

@app.post("/predict/", response_model=SentimentOutput)
async def predict(text_input: TextInput):
    tokenized_text = inference_utils.clean_and_tokenize_text(text_input.text, tokenizer)
    pred = inference_utils.inference_step(tokenized_text, model)
    
    class_mapping = {index: class_name for index, class_name in enumerate(class_names)}
    flags = [class_mapping[index] for index, value in enumerate(pred) if value == 1]
    
    return {"sentiment": flags}