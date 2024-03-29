from transformers import pipeline


loaded_gen = pipeline("token-classification", 'models/ner/')
sample_text = "My name is John and I live in California."

def ner_forward(text):
    output = loaded_gen(text, aggregation_strategy="first")
    return output

if __name__ == '__main__':
    output = ner_forward(sample_text)
    print(output)