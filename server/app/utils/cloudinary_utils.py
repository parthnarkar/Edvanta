import requests

CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dnihe4ihi/video/upload"
UPLOAD_PRESET = "podcast-visualizer"

def upload_video_to_cloudinary(video_path):
    with open(video_path, "rb") as video_file:
        files = {"file": video_file}
        data = {"upload_preset": UPLOAD_PRESET}
        response = requests.post(CLOUDINARY_UPLOAD_URL, files=files, data=data)
        if response.status_code == 200:
            return response.json()["secure_url"]
        else:
            raise Exception(f"Cloudinary upload failed: {response.text}")