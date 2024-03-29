import whisper

model = whisper.load_model("tiny")


result = model.transcribe("audio_samples/balls.mp3")
print(result["text"])