import requests
import cloudinary
import cloudinary.uploader
import os
import tempfile
from app.config import Config


CLOUDINARY_UPLOAD_URL = f"https://api.cloudinary.com/v1_1/dnihe4ihi/video/upload"
UPLOAD_PRESET = "podcast-visualizer"

cloudinary.config(
  cloud_name = Config.CLOUDINARY_CLOUD_NAME,
  api_key = Config.CLOUDINARY_API_KEY,
  api_secret = Config.CLOUDINARY_API_SECRET
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
  Fetch a file from Cloudinary by constructing a raw URL.
  Avoid appending duplicate extensions when public_id already includes one.
  Returns the file content (bytes).
  """
  cloud_name = Config.CLOUDINARY_CLOUD_NAME
  api_key = Config.CLOUDINARY_API_KEY
  api_secret = Config.CLOUDINARY_API_SECRET

  pid = public_id or ""
  # If public_id already ends with the expected extension, don't append another
  if pid.lower().endswith(f".{file_format.lower()}"):
    path = pid
  else:
    # If public_id appears to already include any extension, also avoid appending ours
    base = os.path.basename(pid)
    if "." in base:
      path = pid
    else:
      path = f"{pid}.{file_format}"

  def do_get(p):
    url = f"https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{p}"
    r = requests.get(url, auth=(api_key, api_secret))
    if r.status_code == 404:
      raise FileNotFoundError(url)
    r.raise_for_status()
    return r.content

  # Try primary path first; on 404, toggle extension presence and retry once
  try:
    return do_get(path)
  except FileNotFoundError:
    # Toggle extension presence
    base = os.path.basename(pid)
    if "." in base:
      # had extension; try without
      alt = pid.rsplit(".", 1)[0]
    else:
      alt = f"{pid}.{file_format}"
    return do_get(alt)
