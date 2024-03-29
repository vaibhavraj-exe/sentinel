from collections import Counter
import cv2
from PIL import Image
import io
import base64
import PyPDF2
from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import List
import time
import pika
import json
import asyncio
import uuid
import threading
import re
import tempfile
import os

from video_detection import video_detection
from models.personal_identification_info_detection.tokens import find_tokens

import numpy as np
from transformers import pipeline

loaded_gen = pipeline(
    "token-classification", "models/personal_identification_info_detection/model/"
)

import joblib
import numpy as np

scaler = joblib.load("models/spam_account_detection/models/scaler.pkl")
model = joblib.load(
    "models/spam_account_detection/models/logistic_regression_model.pkl"
)


def extract_text_from_pdf(pdf_file_path: UploadFile = File(...)):
    text = ""
    old_text = ""
    print(pdf_file_path)
    # with open(pdf_file_path.filename, "wb") as file_object:
    #     file_object.write(pdf_file_path.file.read())
    with open(pdf_file_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)
        num_pages = len(pdf_reader.pages)
        for page_num in range(num_pages):
            page = pdf_reader.pages[page_num]
            old_text += page.extract_text()
            text += page.extract_text().replace("\n", "").strip()
    return text

def spam_forward(input):
    columns_to_standardize = [2, 3, 4, 7, 8]
    input = np.array([input])
    data_to_transform = input[:, columns_to_standardize]
    transformed_data = scaler.transform(data_to_transform)
    standardized_input = input.copy()
    standardized_input[:, columns_to_standardize] = transformed_data
    predictions = model.predict_proba(standardized_input)
    spam_pred = predictions[0][1]
    return spam_pred


def extract_links(text):
    return re.findall(r"(https?://\S+)", text)


def generateUniqueId():
    return str(uuid.uuid4())


def generateQueueKey(payload: dict):
    key = "message" if payload.get("text") else "account"
    if payload.get("image"):
        key += ".image"
    if payload.get("pdf"):
        key += ".pdf"
    if payload.get("video"):
        key += ".image"
        key += ".video"
    if payload.get("text"):
        key += ".text"
        if extract_links(payload["text"]):
            key += ".link"
        elif payload["text"].strip() != "":
            key += ".text"
    return key


app = FastAPI() 

start_time = time.time()


class Payload(BaseModel):
    text: str | None = "Kill me please http://pornhub.com"
    image: str | None = None
    pdf: str | None = None


class SpamPayload(BaseModel):
    features: List[str]
    account_info: List[float]
    # features: List[str]
    # regular: List[float]
    # spam: List[float]

class PII(BaseModel):
    text: str | None = "John Smith (applicant for Software Engineer position) recently applied for a job at TechCorp. His email address is john.smith@email.com and phone number is (555) 555-5555. In his resume, he mentioned his experience with Python and Java"

EXCHANGE_NAME = "message_exchange"
RESULTS_QUEUE = "results_queue"
RESULTS_FILE_PATH = "results.json"
channel = None
data = []
pii_data = []

all_services = services = [
    {
        "name": "profanity_detection",
        "categories": [
            "toxic",
            "severe_toxic",
            "obscene",
            "threat",
            "insult",
            "identity_hate",
        ],
        "types": ["text"],
    },
    {
        "name": "link_detection",
        "categories": ["SCAM", "MALWARE", "IP_LOGGER", "NOHTTPS", "EXPLICIT"],
        "types": ["link"],
    },
    {
        "name": "image_detection",
        "categories": ["HARMFUL"],
        "types": ["image"],
    },
]
    # {"name": "personal_info_detection", "types": ["message", "text"]},
    # {"name": "account_verification", "categories": ["is_valid"], "types": ["account"]},


def read_txt_data(nsfw=False):
    print("nsfw:", nsfw, type(nsfw))
    file_path = None
    if nsfw == "True":
        file_path = f"data/images/nsfw.txt"
    else:
        file_path = f"data/images/non.txt"
    print("file_path:", file_path)
    try:
        with open(file_path, "r") as file:
            txt_data = file.read()
        return txt_data
    except FileNotFoundError:
        return "File not found."


async def waitForResults(
    id: str,
    return_on_any_harmful=True,
    return_all_results=True,
    routing_key="message",
    services=[],
):
    keys = list(set(routing_key.split(".")))

    print("Keys:", keys)
    relevant_services = []

    print("ser:", services)

    if len(services) == 0:
        for service in all_services:
            print("Service:", service)
            for key in keys:
                print("Key:", key)
                if key in service["types"]:
                    print("Service is relevant:", service)
                    relevant_services.append(service["name"])
                    break
    services = relevant_services
    print("Services-o:", services)
    while True:
        print("--------------------")
        print("DATA::::")
        print(data)
        print("--------------------")

        if not data:
            print("Waiting for results...")
            await asyncio.sleep(1)
            continue

        result_dict = {"id": id, "services": {}}

        for result in data:
            print("Checking result:", result)
            if result["id"] == id:
                print("Found result for id:", id)
                for result_entry in result.get("results", []):
                    service_name = result_entry.get("service")
                    print("Service name:", service_name)
                    harmful = result_entry.get("result", {}).get("harmful", False)
                    print("Harmful:", harmful)

                    if return_all_results:
                        result_dict["services"][service_name] = result_entry.get(
                            "result"
                        )
                    else:
                        print("Returning only harmful results...")
                        print("Service name:", service_name)
                        result_dict["services"][service_name] = harmful
                    if harmful:
                        if return_on_any_harmful:
                            print("Harmful content detected. Returning results...")
                            return result_dict

        print("All results checked. Checking if all services have responded...")
        print("Services:", services)
        print("Result services:", result_dict["services"].keys())
        all_services_present = sorted(list(result_dict["services"].keys())) <= sorted(
            services
        )
        print("All services present:", all_services_present)

        if all_services_present:
            print("All services have responded.")
            if return_all_results:
                print("Returning all results...")
                return result_dict
            else:
                return result_dict
        else:
            print("Waiting for more results...")
            await asyncio.sleep(1)
            continue


def callback(ch, method, properties, body):
    print("--------------------")
    print("Received message from results queue")
    print(json.loads(body.decode()))
    print("--------------------")

    message = json.loads(body.decode())
    if not message.get("service"):
        print("Invalid message received. Skipping...")
        return

    service = message["service"]
    print("Service:", service)

    existing_entry = next(
        (entry for entry in data if entry["id"] == message["id"]), None
    )
    print("Existing entry:", existing_entry)

    if existing_entry:
        existing_entry["results"].append(
            {"service": message["service"], "result": message["results"]}
        )
    else:
        data.append(
            {
                "id": message["id"],
                "results": [
                    {"service": message["service"], "result": message["results"]}
                ],
            }
        )


def consumeResults(channel, queue_name):
    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
    channel.start_consuming()


async def startup_event():
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host="localhost")
        )
        global channel
        channel = connection.channel()

        channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type="topic")

        result = channel.queue_declare(queue="", exclusive=True)
        queue_name = result.method.queue

        channel.queue_bind(
            exchange=EXCHANGE_NAME, queue=queue_name, routing_key="results"
        )
        channel.queue_bind(
            exchange=EXCHANGE_NAME, queue=queue_name, routing_key="pii_results"
        )

        threading.Thread(
            target=consumeResults,
            args=(
                channel,
                queue_name,
            ),
            daemon=True,
        ).start()
        print(f"Connected to direct exchange: {EXCHANGE_NAME}")

    except Exception as e:
        print("Error establishing connection to RabbitMQ:", e)


async def shutdown_event():
    try:
        if channel:
            channel.close()
            print("Channel closed")
    except Exception as e:
        print("Error closing channel:", e)


app.add_event_handler("startup", startup_event)
app.add_event_handler("shutdown", shutdown_event)


@app.get("/")
async def read_root():
    return {
        "message": "This is up and running",
        "status": "OK",
        "uptime": time.time() - start_time,
    }


@app.post("/check-message")
async def check_message(
    payload: Payload,
    return_on_any_harmful: bool = True,
    return_all_results: bool = True,
):
    try:
        print("Received payload:", payload)
        id = generateUniqueId()
        text = payload.text
        image = payload.image
        pdf = None
        try:
            pdf = payload.pdf
        except AttributeError:
            pass

        print("pdf:", pdf)
        
        # print("Image:", image)
        # print("payload", payload)
        # image = read_txt_data(nsfw=image)
        # print(image.filename)

        if not text:
            raise HTTPException(
                status_code=400, detail="Text is required in the payload"
            )
        
        message = {"id": id, "text": text }

        if image:
            message["image"] = image
        # if video:
        #     message["video"] = video
        if pdf:
            print("pdf confirmed")
            pdf_res = await get_text_from_pdf(pdf)
            print("pdf_res:", pdf_res)
            if pdf_res.get("services").get("profanity_detection").get("harmful"):
                return pdf_res

        print("Publishing message to RabbitMQ...")
        key = generateQueueKey(payload.dict())

        print("Routing key:", key)
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            body=json.dumps(message).encode(),
            routing_key=key,
        )

        print("Message published to RabbitMQ")
        print("Waiting for results...")
        data.clear()
        result = await waitForResults(
            id,
            return_on_any_harmful,
            return_all_results,
            routing_key=key
        )
        print("Returning results:", result)
        return result

    except Exception as e:
        print("Error publishing message to RabbitMQ:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


import base64
import os

async def get_text_from_pdf(pdf_base64: str | None = None):
    print("pdf_base64:", pdf_base64)
    if not pdf_base64:
        return {"error": "No PDF data provided"}

    try:
        pdf_data = base64.b64decode(pdf_base64)
        print("pdf_data:", pdf_data)

        pdf_filename = f"pdf_{generateUniqueId()}.pdf"
        print("pdf_filename:", pdf_filename)

        with open(pdf_filename, "wb") as pdf_file:
            pdf_file.write(pdf_data)

        text = extract_text_from_pdf(pdf_filename)
        print("Text extracted from PDF:", text)

        os.remove(pdf_filename)

        message_id = generateUniqueId()

        message = {"text": text, "id": message_id}

        print(f"Publishing message {message_id} to RabbitMQ...")
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            body=json.dumps(message).encode(),
            routing_key="message.text",
        )
        print("Message published to RabbitMQ")

        data.clear()
        result = await waitForResults(
            message_id,
            return_on_any_harmful=True,
            services=["profanity_detection"],
        )

        print("Returning results:", result)
        return result

    except Exception as e:
        return {"error": str(e)}


@app.post("/check-account")
async def check_account(payload: SpamPayload):
    try:
        payload = payload.dict()
        print("Received payload:", payload)

        data = payload["account_info"]

        """
        "features": [
            "default_profile",
            "default_profile_image",
            "favourites_count",
            "followers_count",
            "friends_count",
            "geo_enabled",
            "verified",
            "average_tweets_per_day",
            "account_age_days"
        ]
        """

        print("data", data)
        output = spam_forward(list(map(float, data)))
        print("output", output)

        return {"fraud_factor": round(output * 100)}

    except Exception as e:
        print("Error publishing message to RabbitMQ:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

from typing import List
from fastapi import UploadFile
import os
from moviepy.editor import VideoFileClip

def extract_frame_path_from_video(video_file: UploadFile) -> List[str]:
    print(video_file.filename)
    data_dir = "data" 
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    print("Data directory:", data_dir)

    video_path = os.path.join(data_dir, video_file.filename)
    with open(video_path, "wb") as buffer:
        buffer.write(video_file.file.read())

    clip = VideoFileClip(video_path)
    frame_paths = []

    for i, frame in enumerate(clip.iter_frames()):
        frame_path = os.path.join(data_dir, f"frame_{i}.jpg")
        frame.save(frame_path)
        frame_paths.append(frame_path)

    print("Frames extracted:", len(frame_paths))
    return frame_paths





# async def extract_frame_path_from_video(video_file: UploadFile):
#     path_list = []
#     with open(video_file.filename, "wb") as file_object:
#         file_object.write(video_file.file.read())
#     video_cap = cv2.VideoCapture(video_file.filename)
#     frame_count = 0
#     while True:
#         ret, frame = video_cap.read()
#         if not ret:
#             break
#         frame_count += 1
#         path = f"frames/{frame_count}.png"
#         with open(path, "wb") as file_object:
#             file_object.write(frame)
#         path_list.append(path)
#     print("Frames extracted from video:", len(path_list))
#     return path_list[:5]

async def extract_frames_from_video(video_file: UploadFile, frame_interval: int, max_frames: int):
    frames_base64 = []

    with open(f"data/videos/{video_file.filename}", "wb") as file_object:
        file_object.write(video_file.file.read())
        print("Video saved to disk")

    video_cap = cv2.VideoCapture(video_file.filename)

    frame_count = 0
    while True:
        ret, frame = video_cap.read()
        if not ret:
            break

        frame_count += 1
        if frame_count % frame_interval == 0:
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            frames_base64.append(frame_base64)

            if len(frames_base64) >= max_frames:
                break

    video_cap.release()

    return frames_base64

@app.post("/check-video")
async def check_video(video_file: UploadFile = File(...), frame_interval: int = 1, max_frames: int = 100):
    frames_base64 = await extract_frames_from_video(video_file, frame_interval, max_frames)
    print("Frames extracted from video:", len(frames_base64))

    frames_base64 = frames_base64

    # frames_base64[0] = read_txt_data(nsfw="True")

    results = []
    now = time.time()   
    for idx, frame_base64 in enumerate(frames_base64):
        id = generateUniqueId()
        print(f"Processing frame {idx + 1}/{len(frames_base64)} with id {id}")
        message = {"image": frame_base64, "id": id}
        print("Publishing message to RabbitMQ...")
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            body=json.dumps(message).encode(),
            routing_key="message.image",
        )
        print("Message published to RabbitMQ")
        data.clear()
        results.append(await waitForResults(
            id,
            routing_key="image"
        ))

    print("time taken", time.time() - now)

    print("All frames processed")
    print("Returning results for all frames")

    for result in results:
        if result["services"]["image_detection"]["harmful"]:
            return {"harmful": True}
            
    return {"harmful": False}



@app.post("/check-pii")
async def check_pii(payload: PII):
    try:
        print("Received payload:", payload)
        text = payload.text

        if not text:
            raise HTTPException(
                status_code=400, detail="Text is required in the payload"
            )
        
        print("Text:", text)
        output = loaded_gen(text, aggregation_strategy="first")
        for item in output:
            item["score"] = int(item["score"] * 100)

        re_output = find_tokens(text)
        output = output + re_output
        print("re_output", re_output)
        print("output", output)
        return {"ner": output}

    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/video-detection")
async def video_det():
    video_det_output = await video_detection(0, fps = 30, output_dir=None, break_after_flag=True)
    print("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", video_det_output)
    return video_det_output
