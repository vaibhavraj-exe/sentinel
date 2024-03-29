"""functions for a single inference"""

from pytorch_modules.model import DistilBERTClass
from transformers import DistilBertTokenizer
import torch


def load_model(model_dir: str):
    model = DistilBERTClass()
    model.load_state_dict(torch.load(model_dir, map_location=torch.device("cpu")))
    model.eval()

    return model


def clean_and_tokenize_text(text, tokenizer, max_len: int = 512):

    lowercse_test_string = text.lower()
    string_array = lowercse_test_string.replace("\xa0", " ").split()
    text = " ".join(string_array)

    # tokenizer = DistilBertTokenizer.from_pretrained(tokenizer_dir, truncation=True, do_lower_case=True)

    inputs = tokenizer.encode_plus(
        text,
        None,
        add_special_tokens=True,
        max_length=max_len,
        pad_to_max_length=True,
        return_token_type_ids=True,
    )

    ids = inputs["input_ids"]
    mask = inputs["attention_mask"]
    token_type_ids = inputs["token_type_ids"]

    tokenized_text = {
        "ids": torch.tensor(ids, dtype=torch.long),
        "mask": torch.tensor(mask, dtype=torch.long),
        "token_type_ids": torch.tensor(token_type_ids, dtype=torch.long),
    }

    return tokenized_text


def inference_step(tokenized_text, model):

    with torch.inference_mode():
        ids = tokenized_text["ids"].to(dtype=torch.long)
        mask = tokenized_text["mask"].to(dtype=torch.long)
        token_type_ids = tokenized_text["token_type_ids"].to(dtype=torch.long)

        output = model(ids, mask, token_type_ids).squeeze(dim=0)
        pred = torch.round(torch.sigmoid(output)).tolist()

    return pred
