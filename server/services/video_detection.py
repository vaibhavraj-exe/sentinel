
import pathlib
import cv2
# from NudeNet import nudenet
import os
import base64
from PIL import Image
import numpy as np
from models.video_detection.NudeNet import nudenet
import asyncio

async def video_detection(path, fps: int, output_dir = None, break_after_flag:bool = False):
    assert fps >= 1, "fps cannot be lower than 1"
    video_detector = nudenet.NudeDetector()
    video_model_fps = 14 # low ball
    video_classes_to_detect = [
        "FEMALE_GENITALIA_COVERED",
        "BUTTOCKS_EXPOSED",
        "FEMALE_BREAST_EXPOSED",
        "FEMALE_GENITALIA_EXPOSED",
        # "MALE_BREAST_EXPOSED",
        "ANUS_EXPOSED",
        # "ARMPITS_EXPOSED",
        # "BELLY_EXPOSED",
        "MALE_GENITALIA_EXPOSED",
        "ANUS_COVERED",
        # "FEMALE_BREAST_COVERED",
        # "BUTTOCKS_COVERED",
    ]
    cap = cv2.VideoCapture(path)
    frame_count = 0
    skip_frames = -(-fps // video_model_fps) 
    output_list = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        cv2.imshow("Live video feed",frame)
        
        if cv2.waitKey(1)== ord("q"): 
            break
    
        if frame_count % skip_frames == 0:
            frame_prediction = video_detector.detect(frame)
            print(f"Frame {frame_count}: Predicted class: {frame_prediction}")
            
            classes_detected = [detection for detection in frame_prediction if
                                detection["class"] in video_classes_to_detect and detection.get("score", 0) >= 0.5]
            print(classes_detected)

            if break_after_flag and classes_detected:
                print("boobie detected")
                cap.release()
                cv2.destroyAllWindows()
                return frame_prediction
                
            elif classes_detected and not break_after_flag:
                print("boobie not detected")
                output_list.append(frame_prediction)
            
            else:
                pass
            
            if output_dir is not None:
                output_dir = 'frames'
                frame_path = os.path.join(output_dir, f'frame_{frame_count}.jpg')
                cv2.imwrite(frame_path, frame)
    
        frame_count += 1
        await asyncio.sleep(0.1)
    cap.release()
    cv2.destroyAllWindows()
    print("balls")
    return output_list
