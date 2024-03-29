from cache import Cache
import pika
import json
import re
import requests
import time

RABBITMQ_HOST = "localhost"
RABBITMQ_EXCHANGE = "message_exchange"
RESULTS_QUEUE = "results_queue"
SAFE_LINK_API_URL = "https://api.safelink.gg/v1/check"

cache = Cache(ttl=3000000)


def extract_links(text):
    return re.findall(r"(https?://\S+)", text)


def check_link_safety(links):
    links_tuple = tuple(links)

    cached_results = cache.get(links_tuple)
    if cached_results:
        cached_results["cached"] = True
        return cached_results

    payload = {"urls": links}
    response = requests.post(SAFE_LINK_API_URL, json=payload)
    safety_results = response.json()
    safety_results["timestamp"] = int(time.time())
    safety_results["cached"] = False

    cache.set(links_tuple, safety_results)

    return safety_results


def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    channel.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type="topic")

    result = channel.queue_declare(queue="", exclusive=True)
    queue_name = result.method.queue

    channel.queue_bind(
        exchange=RABBITMQ_EXCHANGE, queue=queue_name, routing_key="#.link.#"
    )

    def callback(ch, method, properties, body):
        print("Received message from RabbitMQ...")
        message = json.loads(body)
        query_id = message["id"]
        text = message["text"]
        links = extract_links(text)
        if not links:
            print("No links found in message. Skipping...")
            channel.basic_publish(
                exchange=RABBITMQ_EXCHANGE,
                routing_key="results",
                body=json.dumps(
                    {
                        "id": query_id,
                        "service": "link_detection",
                        "results": {"safety": {}, "harmful": False},
                    }
                ),
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return
        safety_results = check_link_safety(links) or {}
        harmful = safety_results.get("data") and any(
            len(item.get("flags", [])) > 0 for item in safety_results["data"]
        )

        print("harmful", harmful)

        print("Publishing results to RabbitMQ...")

        print("safety_results", safety_results)
        categories = [item.get("flags") for item in safety_results["data"]] 
        categories = [flag for sublist in categories for flag in sublist]

        print("categories", categories)
        channel.basic_publish(
            exchange=RABBITMQ_EXCHANGE,
            routing_key="results",
            body=json.dumps(
                {
                    "id": query_id,
                    "service": "link_detection",
                    "results": {"safety": safety_results, "harmful": harmful, "categories": categories},
                }
            ),
        )

        print("Acknowledging message...")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_consume(queue=queue_name, on_message_callback=callback)

    print("Link Detection Service started. Waiting for messages...")
    channel.start_consuming()


if __name__ == "__main__":
    main()
