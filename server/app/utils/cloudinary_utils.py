"""Cloudinary helper functions (placeholders).

Future implementations may include:
- upload_file(file) -> returns {url, public_id}
- delete_file(public_id)
- transform_image(public_id, options)
"""

# from cloudinary import uploader  # Uncomment when cloudinary package installed


def upload_file(file_obj):  # pragma: no cover - placeholder
    """Upload file to Cloudinary.

    Steps (future):
      1. Validate file type / size
      2. Call cloudinary.uploader.upload
      3. Return relevant metadata (url, public_id)
    """
    raise NotImplementedError("Placeholder - implement Cloudinary upload logic")
