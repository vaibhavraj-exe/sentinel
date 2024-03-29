# Train params
BATCH_SIZE = 10
MAX_LEN = 512
EPOCHS = 1
LEARNING_RATE = 1e-05
NUM_WORKERS = 2


# Compute relatied
ACCELERATOR = "gpu"
DEVICES = [0]
PRECISION = "16-mixed"
LOGS_DIR = "logs/"

DATA_DIR = "dataset/cleaned_train.csv"
MODEL_DIR = "models/test_model.pt"
TOKENIZER_DIR = "models/tokenizer"
