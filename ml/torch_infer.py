from pytorch_modules import inference_utils
from pytorch_modules import config
from pytorch_modules.model import DistilBERTClass
from transformers import DistilBertTokenizer
import torch

model = inference_utils.load_model(config.MODEL_DIR)
tokenizer = DistilBertTokenizer.from_pretrained(config.TOKENIZER_DIR, truncation=True, do_lower_case=True)
class_names = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
class_mapping = {index: class_name for index, class_name in enumerate(class_names)}

def forward(text, model, tokenizer):
    
    tokenized_text = inference_utils.clean_and_tokenize_text(text, tokenizer)
    pred = inference_utils.inference_step(tokenized_text, model)
    
    return pred

if __name__ == '__main__':
    text = "DIE LJAHS:DLKJASD*!(@&#!(P@:___)"
    pred = forward(text, model=model, tokenizer=tokenizer)
    class_mapping = {index: class_name for index, class_name in enumerate(class_names)}
    flags = [class_mapping[index] for index, value in enumerate(pred) if value == 1]
    
    print(flags)