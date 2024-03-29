# Import module
from nudenet import NudeClassifier

# initialize classifier (downloads the checkpoint file automatically the first time)
classifier = NudeClassifier()
# sample_image = 'image_samples/sleep.jpeg'
sample_image = 'frames/frame_140.jpg'
# Classify single image
if __name__ == "__main__":
    result = classifier.classify(sample_image)
    print(result)
# Returns {'path_to_image_1': {'safe': PROBABILITY, 'unsafe': PROBABILITY}}
