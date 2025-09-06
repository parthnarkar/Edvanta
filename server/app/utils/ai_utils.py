"""Vertex AI helper functions for Edvanta.

Provides functionality for:
- Conversational AI for tutoring
- Text summarization
- Image generation
"""

import json
import os
import vertexai
from vertexai.generative_models import GenerativeModel, Part
from vertexai.preview.generative_models import GenerationConfig, HarmCategory, HarmBlockThreshold
from app.config import Config
from google.oauth2 import service_account
import base64


def init_vertex_ai():
    """Initialize the Vertex AI client."""
    try:
        # Get credentials from environment or config
        project_id = Config.GOOGLE_CLOUD_PROJECT
        location = Config.GOOGLE_CLOUD_LOCATION
        credentials_base64 = Config.VERTEX_DEFAULT_CREDENTIALS

        # Convert base64 to credentials
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(base64.b64decode(credentials_base64))
        )
        
        # Initialize Vertex AI
        vertexai.init(project=project_id, location=location, credentials=credentials)
        return True
    except Exception as e:
        print(f"Error initializing Vertex AI: {e}")
        return False


def get_vertex_response(prompt, context=None):
    """Generate a response using Vertex AI.
    
    Args:
        prompt (str): The user's input text
        context (dict, optional): Additional context like mode, subject, etc.
    
    Returns:
        str: The AI-generated response
    """
    # Initialize Vertex AI if needed
    init_vertex_ai()

    # Default model to use - Gemini 2.5 Flash
    model_name = Config.VERTEX_MODEL_NAME
    
    try:
        # Load the model
        model = GenerativeModel(model_name)
        
        # Prepare system instructions based on context
        system_instruction = _build_system_instruction(context)
        
        # Configure safety settings
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }
        
        # Configure generation parameters
        generation_config = GenerationConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=1024,
        )
        
        # Generate the response
        response = model.generate_content(
            [system_instruction, prompt],
            generation_config=generation_config,
            safety_settings=safety_settings,
        )
        
        # Return the text response
        return response.text
    except Exception as e:
        print(f"Error generating Vertex AI response: {e}")
        raise


def _build_system_instruction(context):
    """Build a system instruction based on context."""
    if not context:
        return "You are a helpful AI tutor."
    
    mode = context.get('mode', 'tutor')
    subject = context.get('subject', 'general')
    is_welcome = context.get('is_welcome', False)
    is_error_state = context.get('is_error_state', False)
    is_goodbye = context.get('is_goodbye', False)
    voice_enabled = context.get('voice_enabled', None)
    
    if is_error_state:
        return ("You are a helpful AI tutor. The user is experiencing technical difficulties. "
                f"Provide a supportive response for the {mode} mode about {subject}. "
                "Keep your response brief and encouraging.")
    
    if is_welcome:
        return (f"You are a helpful AI tutor in {mode} mode focusing on {subject}. "
                "Generate a warm, engaging welcome message to start the session. "
                "Keep it concise (2-3 sentences) and set expectations for what the user will learn.")
    
    if is_goodbye:
        return ("You are a helpful AI tutor ending a session. "
                "Generate a brief, warm closing message thanking the user for their time. "
                "Keep it concise (1-2 sentences) and encouraging for future learning.")
    
    if voice_enabled is not None:
        state = "enabled" if voice_enabled else "disabled"
        return (f"You are a helpful AI tutor informing the user that voice output has been {state}. "
                f"Generate a brief, friendly message (1 sentence) telling them that voice is now {state}.")
    
    # General system instructions based on mode
    if mode == 'tutor':
        return (f"You are an expert tutor specializing in {subject}. "
                "Provide clear, step-by-step explanations that are educational and helpful. "
                "Use examples to illustrate concepts. Be encouraging and supportive. "
                "Your responses should be thorough but concise and focused on teaching.")
    
    elif mode == 'conversation':
        return (f"You are a conversation partner interested in discussing {subject}. "
                "Be engaging, curious, and thoughtful in your responses. "
                "Ask follow-up questions to encourage deeper exploration of ideas. "
                "Your tone should be conversational and friendly.")
    
    elif mode == 'debate':
        return (f"You are a debate partner helping the user explore different perspectives on {subject}. "
                "Present balanced viewpoints and counterarguments to help the user think critically. "
                "Challenge assumptions respectfully and provide evidence-based reasoning. "
                "Encourage the user to develop and defend their own positions.")
    
    elif mode == 'interview':
        return (f"You are an interview coach helping the user prepare for questions about {subject}. "
                "Ask relevant interview questions and provide constructive feedback on their responses. "
                "Offer suggestions for improvement and highlight strengths. "
                "Your tone should be professional but supportive.")
    
    else:
        return (f"You are a helpful AI assistant focused on {subject}. "
                "Provide clear, informative responses to the user's questions. "
                "Be concise, accurate, and helpful.")


def summarize_text(text: str):
    """Return structured summary of input text using Vertex AI."""
    # Initialize Vertex AI
    init_vertex_ai()
    
    try:
        # Load the model
        model = GenerativeModel("gemini-pro")
        
        # Create the prompt for summarization
        prompt = f"Please summarize the following text concisely, highlighting the key points:\n\n{text}"
        
        # Generate the summary
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"Error summarizing text: {e}")
        raise


def generate_images(prompts):
    """Generate images based on prompts using Vertex AI's image generation capabilities."""
    # Initialize Vertex AI
    init_vertex_ai()
    
    try:
        # Load the image generation model
        model = GenerativeModel("imagegeneration@002")
        
        results = []
        for prompt in prompts:
            # Generate the image
            response = model.generate_content(prompt)
            
            # Extract the image data
            if response.parts:
                for part in response.parts:
                    if hasattr(part, 'inline_data') and part.inline_data.mime_type.startswith('image/'):
                        results.append({
                            'prompt': prompt,
                            'mime_type': part.inline_data.mime_type,
                            'data': part.inline_data.data
                        })
        
        return results
    except Exception as e:
        print(f"Error generating images: {e}")
        raise
