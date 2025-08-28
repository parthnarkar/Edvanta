import os
import tempfile
import base64
import vertexai
from vertexai.generative_models import GenerativeModel
from vertexai.preview.vision_models import ImageGenerationModel

def setup_vertex_ai():
    """Set up Vertex AI credentials and return initialized model"""
    # Set up Vertex AI credentials
    credentials_base64 = os.environ.get("GOOGLE_CREDENTIALS_JSON_BASE64")
    if not credentials_base64:
        raise RuntimeError("GOOGLE_CREDENTIALS_JSON_BASE64 not found in environment variables")
    
    key_file_path = os.path.join(tempfile.gettempdir(), "key.json")
    with open(key_file_path, "w") as f:
        f.write(base64.b64decode(credentials_base64).decode("utf-8"))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file_path
    
    project_id = os.environ.get("GCP_PROJECT_ID")
    location = os.environ.get("LOCATION")
    vertexai.init(project=project_id, location=location)
    
    return GenerativeModel("gemini-2.5-flash")

def generate_content_with_vertex_ai(prompt):
    """Generate content using Vertex AI Gemini model"""
    model = setup_vertex_ai()
    response = model.generate_content(prompt)
    return response.text.strip()

def generate_images_with_vertex_ai(prompts):
    """Generate images using Vertex AI Imagen model"""
    # Setup Vertex AI with specific project for image generation
    vertexai.init(project="massive-graph-465922-i8", location="us-central1")
    generation_model = ImageGenerationModel.from_pretrained("imagen-4.0-generate-preview-06-06")
    
    generated_images = []
    for i, prompt in enumerate(prompts):
        try:
            images = generation_model.generate_images(
                prompt=prompt,
                number_of_images=1,
                aspect_ratio="9:16",
                negative_prompt="",
                person_generation="allow_all",
                safety_filter_level="block_few",
                add_watermark=True,
            )
            # Save image locally
            image_path = f"ai_image_{i}.png"
            images[0].save(image_path)
            generated_images.append(image_path)
        except Exception as e:
            print(f"⚠️ Failed to generate image for prompt: {prompt[:50]}... Error: {e}")
            continue
    
    return generated_images

import os
import json
import re
from gtts import gTTS
from PIL import Image, ImageDraw, ImageFont
from moviepy import (
    VideoFileClip,
    ImageClip,
    AudioFileClip,
    CompositeVideoClip,
    concatenate_videoclips
)
from utils.vertex_ai_helper import generate_content_with_vertex_ai, generate_images_with_vertex_ai

WIDTH, HEIGHT = 432, 768
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_SIZE = 28

AI_PROMPT = '''You are a helpful assistant. Analyze the following podcast transcript and extract the top 3 most important key moments.

For each key moment, return:
- `image_prompts`: An array of 5-6 detailed, descriptive image prompts that visually represent the concepts discussed in this moment. Each prompt should be specific and vivid, suitable for AI image generation (e.g., "A futuristic laboratory with holographic displays showing DNA sequences and robotic arms conducting experiments", "A diverse group of scientists collaborating around a glowing AI interface in a modern research facility").
- `script`: A **first-person summary** of the moment written in a natural, conversational tone (e.g., "I realized...", "We discussed..."). The script should be approximately **60-75 words**, or **25-30 seconds** when read aloud.

Make the summaries insightful and engaging. Use **ONLY JSON format** in your response — do NOT include timestamps, speaker names, or bullet points.

Example output:
[
  {
    "image_prompts": [
      "A futuristic cityscape with AI-powered robots helping humans in daily tasks",
      "A medical laboratory where AI algorithms analyze patient data on holographic screens",
      "A classroom where students interact with AI tutors through immersive virtual reality",
      "A research facility with scientists collaborating with AI to discover new medicines",
      "A smart home environment where AI assistants seamlessly integrate with family life",
      "A diverse team of ethicists and technologists discussing AI governance around a modern conference table"
    ],
    "script": "I talked about how artificial intelligence is completely transforming fields like healthcare and education. We explored how AI-driven tools are becoming more accessible and discussed the importance of responsible innovation. I realized the future isn't just about technology—it's also about how humans use it thoughtfully and ethically."
  },
  ...
]

Transcript:
'''

def extract_ai_key_moments(transcript_segments):
    """Extract key moments with AI image prompts instead of keywords"""
    transcript_text = "\n".join([t["text"] for t in transcript_segments])
    prompt = AI_PROMPT + transcript_text
    result = generate_content_with_vertex_ai(prompt)
    json_match = re.search(r"\[\s*{.*?}\s*\]", result, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(0))
    raise ValueError("No valid JSON array found in the response.")

def generate_caption_clips(script, idx, total_dur):
    """Generate caption clips for the video"""
    words = script.split()
    chunks = [' '.join(words[i:i+4]) for i in range(0, len(words), 4)]  # 4-word chunks
    dur = total_dur / len(chunks)
    font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    clips = []
    img_files = []
    
    for j, chunk in enumerate(chunks):
        img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        bbox = draw.textbbox((0,0), chunk, font=font)
        x = (WIDTH - (bbox[2]-bbox[0]))//2
        y = HEIGHT - (bbox[3]-bbox[1]) - 60  # Position at bottom with margin
        # Add dark background rectangle
        draw.rectangle([(x-10, y-10), (x+bbox[2]-bbox[0]+10, y+bbox[3]-bbox[1]+10)], fill=(0,0,0,180))
        draw.text((x,y), chunk, font=font, fill="white")
        fname = f"ai_caption_{idx}_{j}.png"
        img.save(fname)
        img_files.append(fname)
        clips.append(
            ImageClip(fname, transparent=True)
                .with_start(j*dur)
                .with_duration(dur)
                .with_position(("center", "bottom"))
        )
    return clips, img_files

def create_ai_key_moment_clip(moment, idx):
    """Create a video clip using AI-generated images instead of stock footage"""
    outdir = "ai_key_moments"
    os.makedirs(outdir, exist_ok=True)
    
    # Generate speech audio
    audio_file = f"ai_speech_{idx}.mp3"
    tts = gTTS(text=moment['script'], lang='en')
    tts.save(audio_file)
    audio = AudioFileClip(audio_file)
    total_dur = audio.duration
    
    # Generate AI images
    print(f"🎨 Generating {len(moment['image_prompts'])} AI images for moment {idx+1}...")
    image_paths = generate_images_with_vertex_ai(moment['image_prompts'])
    
    if not image_paths:
        raise Exception("No AI images could be generated")
    
    # Create video clips from generated images
    per_image_duration = total_dur / len(image_paths)
    image_clips = []
    
    for image_path in image_paths:
        try:
            # Create image clip with proper duration and sizing
            img_clip = (ImageClip(image_path)
                       .with_duration(per_image_duration)
                       .resized((WIDTH, HEIGHT)))
            image_clips.append(img_clip)
        except Exception as e:
            print(f"⚠️ Error processing image {image_path}: {e}")
            continue
    
    if not image_clips:
        raise Exception("No valid image clips could be created")
    
    # Concatenate image clips
    video = concatenate_videoclips(image_clips).with_duration(total_dur)
    
    # Generate captions
    captions, caption_files = generate_caption_clips(moment['script'], idx, total_dur)
    
    # Compose final video with captions and audio
    final = CompositeVideoClip([video, *captions]).with_audio(audio).with_duration(total_dur)
    
    # Export final video
    outfile = os.path.join(outdir, f"ai_keymoment_{idx}.mp4")
    final.write_videofile(outfile, fps=24, codec="libx264", audio_codec="aac")
    
    # Cleanup temporary files
    audio.close()
    if os.path.exists(audio_file):
        os.remove(audio_file)
    
    for fname in caption_files:
        if os.path.exists(fname):
            os.remove(fname)
    
    for image_path in image_paths:
        if os.path.exists(image_path):
            os.remove(image_path)
    
    return outfile
