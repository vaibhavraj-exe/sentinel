import os
import base64
import pika
import json
import base64
from PIL import Image
from io import BytesIO
import cv2
from NudeNet import nudenet


videeo_detector = nudenet.NudeDetector()
video_model_fps = 14 # low ball
video_classes_to_detect = [
    "FEMALE_GENITALIA_COVERED",
    # "FACE_FEMALE",
    "BUTTOCKS_EXPOSED",
    "FEMALE_BREAST_EXPOSED",
    "FEMALE_GENITALIA_EXPOSED",
    "MALE_BREAST_EXPOSED",
    "ANUS_EXPOSED",
    # "FEET_EXPOSED",
    # "BELLY_COVERED",
    # "FEET_COVERED",
    # "ARMPITS_COVERED",
    "ARMPITS_EXPOSED",
    # "FACE_MALE",
    "BELLY_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
    "ANUS_COVERED",
    # "FEMALE_BREAST_COVERED",
    "BUTTOCKS_COVERED",
]
    
def video_detection(path, fps: int, output_dir = None, break_after_flag:bool = False):
    assert fps >= 1, "fps cannot be lower than 1"
    
    cap = cv2.VideoCapture(path)
    # cv2.setWindowProperty("window_name", cv2.WND_PROP_TOPMOST, 1)
    frame_count = 0
    skip_frames = -(-fps // video_model_fps) #ceiling
    # skip_frames = fps // video_model_fps #floor
    output_list = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_count % skip_frames == 0:
            frame_prediction = videeo_detector.detect(frame)

            print("video_classes_to_detect: ", video_classes_to_detect)
            
            classes_detected = [detection for detection in frame_prediction if detection["class"] in video_classes_to_detect]
            print(f"Frame {frame_count}: Predicted class: {frame_prediction}")
            if break_after_flag and classes_detected:
                return frame_prediction
                
            elif classes_detected and not break_after_flag:
                output_list.append(frame_prediction)
            
            else:
                pass
            
            if output_dir is not None:
                output_dir = 'frames'
                frame_path = os.path.join(output_dir, f'frame_{frame_count}.jpg')
                cv2.imwrite(frame_path, frame)
    
        frame_count += 1
    cap.release()
    return output_list

RABBITMQ_HOST = "localhost"
RABBITMQ_EXCHANGE = "message_exchange"
RESULTS_QUEUE = "results_queue"


def check_image_harmful(image_path):
    try:
        video_det_output = video_detection(image_path, fps=30, output_dir=None, break_after_flag=True)
        print(f"video_det_output: {video_det_output}")
        for detection in video_det_output:
            if detection['score'] > 0.5:
                return True
    except Exception as e:
        print(f"Error: {e}")
    return False


def save_image_from_base64(image_base64, message_id):
    try:
        directory = "data/images"
        if not os.path.exists(directory):
            os.makedirs(directory)

        image_data = base64.b64decode(image_base64)
        image_path = f"{directory}/{message_id}.png"
        with open(image_path, "wb") as img_file:
            img_file.write(image_data)
        return image_path
    except Exception as e:
        print(f"Error saving image: {e}")
        return None


def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    channel.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type="topic")

    result = channel.queue_declare(queue="", exclusive=True)
    queue_name = result.method.queue

    channel.queue_bind(
        exchange=RABBITMQ_EXCHANGE, queue=queue_name, routing_key="#.image.#"
    )

    def callback(ch, method, properties, body):
        print("Received message from RabbitMQ...")
        message = json.loads(body)
        print(message)
        query_id = message["id"]
        image_base64 = message["image"]
        # video_base64 = message["video"]

        # 0 - image, 1 - video

        print("Converting base64 image to file...")
        image_path = save_image_from_base64(image_base64, query_id)
        if not image_path:
            print("Error saving image. Skipping processing.")
            return

        print("Checking image for harmful content...")
        print(f"Image path: {image_path}")

        harmful = check_image_harmful(image_path)
        print(f"Harmful: {harmful}")
        print(f"Image is harmful: {harmful}")

        os.remove(image_path)

        print("Publishing results to RabbitMQ...")
        channel.basic_publish(
            exchange=RABBITMQ_EXCHANGE,
            routing_key="results",
            body=json.dumps(
                {
                    "id": query_id,
                    "service": "image_detection",
                    "results": {"harmful": harmful, "categories": ["NSFW"]},
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