from pytorch_modules.model import DistilBERTClass
from pytorch_modules.dataset import MultiLabelDataset
import torch
from pytorch_modules import config
import pandas as pd
from transformers import DistilBertTokenizer
from torch.utils.data import random_split
from torch.utils.data import DataLoader
from pytorch_modules.utils import train, save_model

if __name__ == "__main__":
    device = "cuda" if torch.cuda.is_available() else "cpu"
    df = pd.read_csv(config.DATA_DIR)
    tokenizer = DistilBertTokenizer.from_pretrained(
        "distilbert-base-uncased", truncation=True, do_lower_case=True
    )
    dataset = MultiLabelDataset(
        dataframe=df, tokenizer=tokenizer, max_len=config.MAX_LEN
    )
    train_set, val_set = random_split(
        dataset, [0.8, 0.2], generator=torch.Generator().manual_seed(42)
    )

    train_dataloader = DataLoader(
        dataset=train_set,
        batch_size=config.BATCH_SIZE,
        shuffle=True,
        num_workers=config.NUM_WORKERS,
    )

    val_dataloader = DataLoader(
        dataset=val_set,
        batch_size=config.BATCH_SIZE,
        shuffle=True,
        num_workers=config.NUM_WORKERS,
    )

    model = DistilBERTClass()
    model.to(device)

    loss_fn = torch.nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(params=model.parameters(), lr=config.LEARNING_RATE)

    results = train(
        model=model,
        train_dataloader=train_dataloader,
        test_dataloader=val_dataloader,
        optimizer=optimizer,
        loss_fn=loss_fn,
        epochs=config.EPOCHS,
        device=device,
    )

    save_model(model=model, target_dir="models/", model_name="test_model.pt")
