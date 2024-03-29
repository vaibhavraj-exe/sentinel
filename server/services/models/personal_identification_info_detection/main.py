import numpy as np
from transformers import pipeline
import pika
import json
import os
import base64
from PIL import Image

loaded_gen = pipeline("token-classification", "model/")

RABBITMQ_HOST = "localhost"
RABBITMQ_EXCHANGE = "message_exchange"
RESULTS_QUEUE = "results_queue"


def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    channel.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type="topic")

    result = channel.queue_declare(queue="", exclusive=True)
    queue_name = result.method.queue

    channel.queue_bind(
        exchange=RABBITMQ_EXCHANGE, queue=queue_name, routing_key="#.pii.#"
    )

    def callback(ch, method, properties, body):
        print("Received message from RabbitMQ...")
        message = json.loads(body)
        print(message)
        query_id = message["id"]
        text = message["text"]

        output = loaded_gen(text, aggregation_strategy="first")
        for item in output:
            item["score"] = int(item["score"] * 100)
        print("output", output)
        print("Publishing results to RabbitMQ...")
        channel.basic_publish(
            exchange=RABBITMQ_EXCHANGE,
            routing_key="pii_results",
            body=json.dumps(
                {
                    "id": query_id,
                    "service": "personal_info_detection",
                    "results": {"ner": output},
                }
            ),
        )

        print("Acknowledging message...")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_consume(queue=queue_name, on_message_callback=callback)

    print("Image Detection Service started. Waiting for messages...")
    channel.start_consuming()


if __name__ == "__main__":
    main()
