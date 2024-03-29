from pathlib import Path
import time
from typing import Tuple, Dict, List
import torch
from tqdm.auto import tqdm
from torchmetrics.classification import MultilabelAccuracy
import matplotlib.pyplot as plt
import torchinfo


def train_step(
    epoch: int,
    model: torch.nn.Module,
    dataloader: torch.utils.data.DataLoader,
    loss_fn: torch.nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    disable_progress_bar: bool = False,
) -> Tuple[float, float, Dict]:
    model.train()
    train_loss, train_acc = 0, 0

    progress_bar = tqdm(
        enumerate(dataloader),
        desc=f"Training Epoch {epoch}",
        total=len(dataloader),
        disable=disable_progress_bar,
    )

    train_results = {"train_acc": [], "train_loss": []}

    accuracy = MultilabelAccuracy(num_labels=6).to(device)

    for batch, data in progress_bar:

        ids = data["ids"].to(device, dtype=torch.long)
        mask = data["mask"].to(device, dtype=torch.long)
        token_type_ids = data["token_type_ids"].to(device, dtype=torch.long)
        targets = data["targets"].to(device, dtype=torch.float)

        outputs = model(ids, mask, token_type_ids).squeeze(dim=0)
        loss = loss_fn(outputs, targets)

        train_loss += loss.item()

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        preds = torch.round(torch.sigmoid(outputs))
        # train_acc += torch.eq(targets, preds).sum().item()/len(preds)
        train_acc += accuracy(preds, targets).item()

        progress_bar.set_postfix(
            {
                "train_loss": train_loss / (batch + 1),
                "train_acc": train_acc / (batch + 1),
            }
        )

        if batch % 300 == 0:
            train_results["train_acc"].append(train_acc / (batch + 1))
            train_results["train_loss"].append(train_loss / (batch + 1))

    train_loss = train_loss / len(dataloader)
    train_acc = train_acc / len(dataloader)
    return train_loss, train_acc, train_results


def test_step(
    epoch: int,
    model: torch.nn.Module,
    dataloader: torch.utils.data.DataLoader,
    loss_fn: torch.nn.Module,
    device: torch.device,
    disable_progress_bar: bool = False,
) -> Tuple[float, float, Dict]:

    model.eval()
    test_loss, test_acc = 0, 0

    accuracy = MultilabelAccuracy(num_labels=6).to(device)

    progress_bar = tqdm(
        enumerate(dataloader),
        desc=f"Testing Epoch {epoch}",
        total=len(dataloader),
        disable=disable_progress_bar,
    )
    test_results = {"test_acc": [], "test_loss": []}

    with torch.inference_mode():
        for batch, data in progress_bar:

            ids = data["ids"].to(device, dtype=torch.long)
            mask = data["mask"].to(device, dtype=torch.long)
            token_type_ids = data["token_type_ids"].to(device, dtype=torch.long)
            targets = data["targets"].to(device, dtype=torch.float)

            outputs = model(ids, mask, token_type_ids).squeeze(dim=0)

            loss = loss_fn(outputs, targets)
            test_loss += loss.item()

            preds = torch.round(torch.sigmoid(outputs))
            # test_acc += torch.eq(targets, preds).sum().item()/len(preds)
            test_acc += accuracy(preds, targets).item()

            progress_bar.set_postfix(
                {
                    "test_loss": test_loss / (batch + 1),
                    "test_acc": test_acc / (batch + 1),
                }
            )

            if batch % 300 == 0:
                test_results["test_acc"].append(test_acc / (batch + 1))
                test_results["test_loss"].append(test_loss / (batch + 1))

    test_loss = test_loss / len(dataloader)
    test_acc = test_acc / len(dataloader)
    return test_loss, test_acc, test_results


def train(
    model: torch.nn.Module,
    train_dataloader: torch.utils.data.DataLoader,
    test_dataloader: torch.utils.data.DataLoader,
    optimizer: torch.optim.Optimizer,
    loss_fn: torch.nn.Module,
    epochs: int,
    device: torch.device,
    disable_progress_bar: bool = False,
) -> Dict[str, List]:

    results = {
        "train_results": [],
        "test_results": [],
        "train_epoch_time": [],
        "test_epoch_time": [],
    }

    for epoch in tqdm(range(epochs), disable=disable_progress_bar):

        train_epoch_start_time = time.time()
        train_loss, train_acc, train_results = train_step(
            epoch=epoch,
            model=model,
            dataloader=train_dataloader,
            loss_fn=loss_fn,
            optimizer=optimizer,
            device=device,
            disable_progress_bar=disable_progress_bar,
        )
        train_epoch_end_time = time.time()
        train_epoch_time = train_epoch_end_time - train_epoch_start_time

        test_epoch_start_time = time.time()
        test_loss, test_acc, test_results = test_step(
            epoch=epoch,
            model=model,
            dataloader=test_dataloader,
            loss_fn=loss_fn,
            device=device,
            disable_progress_bar=disable_progress_bar,
        )
        test_epoch_end_time = time.time()
        test_epoch_time = test_epoch_end_time - test_epoch_start_time

        print(
            f"Epoch: {epoch+1} | "
            f"train_loss: {train_loss:.4f} | "
            f"train_acc: {train_acc:.4f} | "
            f"test_loss: {test_loss:.4f} | "
            f"test_acc: {test_acc:.4f} | "
            f"train_epoch_time: {train_epoch_time:.4f} | "
            f"test_epoch_time: {test_epoch_time:.4f}"
        )

        results["train_results"].append(train_results)
        results["test_results"].append(test_results)
        results["train_epoch_time"].append(train_epoch_time)
        results["test_epoch_time"].append(test_epoch_time)

    return results


def save_model(model: torch.nn.Module, target_dir: str, model_name: str):

    target_dir_path = Path(target_dir)
    target_dir_path.mkdir(parents=True, exist_ok=True)

    assert model_name.endswith(".pth") or model_name.endswith(
        ".pt"
    ), "model_name should end with '.pt' or '.pth'"
    model_save_path = target_dir_path / model_name

    print(f"[INFO] Saving model to: {model_save_path}")
    torch.save(obj=model.state_dict(), f=model_save_path)


def plot_loss_curves(results):

    loss = results["train_loss"]
    test_loss = results["test_loss"]

    accuracy = results["train_acc"]
    test_accuracy = results["test_acc"]

    train_epochs = range(len(results["train_loss"]))
    test_epochs = range(len(results["test_loss"]))

    plt.figure(figsize=(15, 7))

    # Plot loss
    plt.subplot(1, 2, 1)
    plt.plot(train_epochs, loss, label="train_loss")
    plt.plot(test_epochs, test_loss, label="test_loss")
    plt.title("Loss")
    plt.xlabel("Epochs")
    plt.legend()

    # Plot accuracy
    plt.subplot(1, 2, 2)
    plt.plot(train_epochs, accuracy, label="train_accuracy")
    plt.plot(test_epochs, test_accuracy, label="test_accuracy")
    plt.title("Accuracy")
    plt.xlabel("Epochs")
    plt.legend()


def model_summary(model: torch.nn.Module, input_size: Tuple):
    """Writes a summary of the given model

    Args:
        model (torch.nn.Module): instance of a pytorch model
        input_size (Tuple): input dimensions of the forward pass

    Example usage:
        model_summary(model=vision_transformer,
                      input_size=(batch_size,1,197,768))
    """
    torchinfo.summary(
        model=model,
        input_size=input_size,
        col_names=["input_size", "output_size", "num_params", "trainable"],
        col_width=20,
        row_settings=["var_names"],
    )
