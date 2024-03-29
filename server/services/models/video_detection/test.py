import pathlib
import cv2
from NudeNet import nudenet
import os
import base64
from PIL import Image
import numpy as np
from NudeNet import nudenet


video_detector = nudenet.NudeDetector()
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
    "FEMALE_BREAST_COVERED",
    "BUTTOCKS_COVERED",
]
    
def video_detection(path, fps: int, output_dir = None, break_after_flag:bool = False):
    assert fps >= 1, "fps cannot be lower than 1"
    
    cap = cv2.VideoCapture(path)
    frame_count = 0
    skip_frames = -(-fps // video_model_fps) #ceiling
    # skip_frames = fps // video_model_fps #floor
    output_list = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        cv2.imshow("press q to exit",frame)
        
        if cv2.waitKey(1)== ord("q"):    #use this for video
            break
    
        if frame_count % skip_frames == 0:
            frame_prediction = video_detector.detect(frame)
            print(f"Frame {frame_count}: Predicted class: {frame_prediction}")
            
            classes_detected = [detection for detection in frame_prediction if detection["class"] in video_classes_to_detect]
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
    cv2.destroyAllWindows()
    return output_list

def stringToImage(base64_string):
    imgdata = base64.b64decode(base64_string)
    return Image.open(io.BytesIO(imgdata))

# convert PIL Image to an RGB image( technically a numpy array ) that's compatible with opencv
def toRGB(image):
    return cv2.cvtColor(np.array(image), cv2.COLOR_BGR2RGB)

def video_detection_base_64(path, fps: int, output_dir = None, break_after_flag:bool = False):
    assert fps >= 1, "fps cannot be lower than 1"
    
    cap = cv2.VideoCapture(path)
    frame_count = 0
    skip_frames = -(-fps // video_model_fps) #ceiling
    # skip_frames = fps // video_model_fps #floor
    output_list = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_count % skip_frames == 0:
            frame_prediction = video_detector.detect(frame)
            print(f"Frame {frame_count}: Predicted class: {frame_prediction}")
            
            classes_detected = [detection for detection in frame_prediction if detection["class"] in video_classes_to_detect]
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

if __name__ == '__main__':
    video_det_output = video_detection(0, fps = 30, output_dir=None, break_after_flag=True)
    # video_det_output = video_detection(0, fps = 30, output_dir=None, break_after_flag=True) for webcam 
    print(video_det_output)