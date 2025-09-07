import requests
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
import tempfile


load_dotenv()

CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dnihe4ihi/video/upload"
UPLOAD_PRESET = "podcast-visualizer"

cloudinary.config(
  cloud_name = os.getenv('CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_APIKEY'),
  api_secret = os.getenv('CLOUDINARY_SECRET')
)


def upload_video_to_cloudinary(video_path):
    with open(video_path, "rb") as video_file:
        files = {"file": video_file}
        data = {"upload_preset": UPLOAD_PRESET}
        response = requests.post(CLOUDINARY_UPLOAD_URL, files=files, data=data)
        if response.status_code == 200:
            return response.json()["secure_url"]
        else:
            raise Exception(f"Cloudinary upload failed: {response.text}")


def upload_file_to_cloudinary(file):
  """
  Uploads a file object to Cloudinary and returns the result dict.
  Args:
    file: FileStorage object from Flask (request.files['resume'])
  Returns:
    dict: { 'secure_url': ..., 'public_id': ... }
  """
  # Save file temporarily
  temp_dir = tempfile.gettempdir()
  temp_path = os.path.join(temp_dir, file.filename)
  file.save(temp_path)
  try:
    result = cloudinary.uploader.upload(temp_path, resource_type="raw")
    # raw_url = f"https://res.cloudinary.com/{cloudinary.config().cloud_name}/raw/upload/{result.get('public_id')}"
    return {
      'secure_url': result.get('secure_url'),
      # 'url': raw_url,
      'public_id': result.get('public_id')
    }
  finally:
    if os.path.exists(temp_path):
      os.remove(temp_path)

def fetch_file_from_cloudinary(public_id, resource_type="raw", file_format="pdf"):
  """
  Fetch a private file from Cloudinary using the Admin API.
  Returns the file content (bytes).
  """
  cloud_name = os.getenv("CLOUD_NAME")
  api_key = os.getenv("CLOUDINARY_APIKEY")
  api_secret = os.getenv("CLOUDINARY_SECRET")
  download_url = f"https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}.{file_format}"

  response = requests.get(
    download_url,
    auth=(api_key, api_secret)
  )
  response.raise_for_status()
  return response.content
