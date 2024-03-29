import re
import pika
import json

RABBITMQ_HOST = "localhost"
RABBITMQ_EXCHANGE = "message_exchange"
RESULTS_QUEUE = "results_queue"

from transformers import DistilBertTokenizer
from pytorch_modules import inference_utils, config

model = inference_utils.load_model(config.MODEL_DIR)
tokenizer = DistilBertTokenizer.from_pretrained(
    config.TOKENIZER_DIR, truncation=True, do_lower_case=True
)
class_names = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
class_mapping = {index: class_name for index, class_name in enumerate(class_names)}


def remove_links(text):
    url_pattern = r"https?://\S+"
    cleaned_text = re.sub(url_pattern, "", text)
    return cleaned_text


def contains_profanity(text):
    text = remove_links(text)
    if not text:
        return {"sentiment": []}
    tokenized_text = inference_utils.clean_and_tokenize_text(text, tokenizer)
    pred = inference_utils.inference_step(tokenized_text, model)

    class_mapping = {index: class_name for index, class_name in enumerate(class_names)}
    flags = [class_mapping[index] for index, value in enumerate(pred) if value == 1]

    return {"sentiment": flags}


def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    channel.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type="topic")

    result = channel.queue_declare(queue="", exclusive=True)
    queue_name = result.method.queue

    channel.queue_bind(
        exchange=RABBITMQ_EXCHANGE, queue=queue_name, routing_key="#.text.#"
    )

    def callback(ch, method, properties, body):
        message = json.loads(body)
        print("Received message from RabbitMQ...")
        query_id = message["id"]
        text = message["text"]
        print("text", text)

        sentiment = contains_profanity(text)
        sentiment = sentiment.get("sentiment", [])
        print("sentiment", sentiment)

        print("Publishing results to RabbitMQ...")
        channel.basic_publish(
            exchange=RABBITMQ_EXCHANGE,
            routing_key="results",
            body=json.dumps(
                {
                    "id": query_id,
                    "service": "profanity_detection",
                    "results": {"categories": sentiment, "harmful": len(sentiment) > 0},
                }
            ),
        )

        print("Acknowledging message...")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_consume(queue=queue_name, on_message_callback=callback)

    print("Profanity Detection Service started. Waiting for messages...")
    channel.start_consuming()


if __name__ == "__main__":
    main()
