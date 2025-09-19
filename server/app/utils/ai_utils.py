"""Vertex AI helper functions for Edvanta.

Provides functionality for:
- Conversational AI for tutoring
- Text summarization
- Image generation
- Voice chat history management
"""

import json
import os
import traceback
vertexai = None
GenerativeModel = None
Part = None
GenerationConfig = None
HarmCategory = None
HarmBlockThreshold = None
from app.config import Config
try:
    from google.oauth2 import service_account
except Exception:  # pragma: no cover - optional dependency
    service_account = None
import base64
from pymongo import MongoClient
from datetime import datetime

# In-memory fallbacks when MongoDB is not available (keeps runtime state per instance)
_voice_chat_store = {}
_active_sessions_store = {}


# Initialize MongoDB connection
def get_db_connection():
    """Get MongoDB connection and return the database object."""
    try:
        # Log the connection string (without password) for debugging
        connection_string = Config.MONGODB_URI
        if connection_string:
            # Mask the password in the log for security
            masked_uri = connection_string.replace("://", "://***:***@")
            
        else:
            return None

        if not Config.MONGODB_DB_NAME:
            return None
            
            
        # Attempt to connect with a timeout
        client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Force a connection to verify it works
        client.server_info()
        
        db = client[Config.MONGODB_DB_NAME]
        # Verify we can access the database
        collections = db.list_collection_names()
        
        
        return db
    except Exception as e:
        return None

# Voice chat history functions
def save_chat_message(user_email, message, is_ai=False, context=None):
    """Save a chat message to the voice_chat collection with additional metadata.
    
    Args:
        user_email (str): The user's email identifier
        message (str): The message content
        is_ai (bool): Whether the message is from AI (True) or user (False)
        context (dict, optional): Additional context like session_id, mode, etc.
    
    Returns:
        bool: Success status
    """
    try:
        db = get_db_connection()
        # Prepare the new message with additional metadata
        new_message = {
            "content": message,
            "is_ai": is_ai,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Get session ID from context if available
        session_id = None
        if context and "session_id" in context:
            session_id = context["session_id"]

        # Add context metadata if provided
        if context:
            message_context = {}
            for key in ["session_id", "mode", "subject", "is_voice_input"]:
                if key in context:
                    message_context[key] = context[key]
            if message_context:
                new_message["context"] = message_context

        # If no session ID, use a default
        if not session_id:
            session_id = "default_session"

        if db is None:
            # Use in-memory fallback
            user_doc = _voice_chat_store.get(user_email)

            if not user_doc:
                _voice_chat_store[user_email] = {
                    "sessions": [{"session_id": session_id, "messages": [new_message], "created_at": datetime.utcnow().isoformat()}],
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                return True

            # Find session
            for s in user_doc.get("sessions", []):
                if s.get("session_id") == session_id:
                    s.setdefault("messages", []).append(new_message)
                    user_doc["updated_at"] = datetime.utcnow().isoformat()
                    return True

            # Create new session
            new_session = {"session_id": session_id, "messages": [new_message], "created_at": datetime.utcnow().isoformat()}
            user_doc.setdefault("sessions", []).append(new_session)
            user_doc["updated_at"] = datetime.utcnow().isoformat()
            return True

        # Get the voice_chat collection
        voice_chat_collection = db[Config.MONGODB_VOICE_CHAT_COLLECTION]

        # Find user's chat history document
        chat_doc = voice_chat_collection.find_one({"user_email": user_email})

        if chat_doc:
            # Check if session exists in the sessions array
            session_exists = False
            if "sessions" in chat_doc:
                for session in chat_doc["sessions"]:
                    if session["session_id"] == session_id:
                        session_exists = True
                        break

            if session_exists:
                # Add message to existing session
                voice_chat_collection.update_one(
                    {"user_email": user_email, "sessions.session_id": session_id},
                    {
                        "$push": {"sessions.$.messages": new_message},
                        "$set": {"updated_at": datetime.utcnow().isoformat()}
                    }
                )
            else:
                # Create new session with this message
                new_session = {
                    "session_id": session_id,
                    "messages": [new_message],
                    "created_at": datetime.utcnow().isoformat()
                }
                voice_chat_collection.update_one(
                    {"user_email": user_email},
                    {
                        "$push": {"sessions": new_session},
                        "$set": {"updated_at": datetime.utcnow().isoformat()}
                    }
                )
        else:
            # Create new user document with session
            new_session = {
                "session_id": session_id,
                "messages": [new_message],
                "created_at": datetime.utcnow().isoformat()
            }
            voice_chat_collection.insert_one({
                "user_email": user_email,
                "sessions": [new_session],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            })

        return True
    except Exception:
        return False

def get_chat_history(user_email, limit=10, session_id=None):
    """Get the user's chat history for a specific session.
    
    Args:
        user_email (str): The user's email identifier
        limit (int): Maximum number of messages to retrieve (default: 10)
        session_id (str, optional): The session ID to get messages for. If None, gets messages from the most recent session.
    
    Returns:
        list: List of message objects with content, is_ai, and timestamp
    """
    try:
        db = get_db_connection()
        if db is None:
            # Return in-memory history
            user_doc = _voice_chat_store.get(user_email)
            if not user_doc:
                return []
            sessions = user_doc.get("sessions", [])
            if session_id:
                for s in sessions:
                    if s.get("session_id") == session_id:
                        msgs = s.get("messages", [])
                        return msgs[-limit:] if len(msgs) > limit else msgs
                return []
            # most recent session
            if not sessions:
                return []
            sorted_sessions = sorted(sessions, key=lambda x: x.get("created_at", ""), reverse=True)
            msgs = sorted_sessions[0].get("messages", [])
            return msgs[-limit:] if len(msgs) > limit else msgs

        # Get the voice_chat collection
        voice_chat_collection = db[Config.MONGODB_VOICE_CHAT_COLLECTION]

        # Find user's chat history
        chat_doc = voice_chat_collection.find_one({"user_email": user_email})

        if not chat_doc or "sessions" not in chat_doc or not chat_doc["sessions"]:
            return []

        # If session_id is provided, get messages from that session
        if session_id:
            for session in chat_doc["sessions"]:
                if session["session_id"] == session_id and "messages" in session:
                    messages = session["messages"]
                    return messages[-limit:] if len(messages) > limit else messages
        else:
            # If no session_id is provided, get messages from the most recent session
            # Sort sessions by created_at in descending order
            sorted_sessions = sorted(
                chat_doc["sessions"], 
                key=lambda x: x.get("created_at", ""), 
                reverse=True
            )
            if sorted_sessions and "messages" in sorted_sessions[0]:
                messages = sorted_sessions[0]["messages"]
                return messages[-limit:] if len(messages) > limit else messages

        return []
    except Exception:
        return []


def clear_chat_history(user_email, session_id=None):
    """Clear a user's chat history, either for a specific session or all sessions.
    
    Args:
        user_email (str): The user's email identifier
        session_id (str, optional): Session ID to clear. If None, clears all chat history for the user.
    
    Returns:
        bool: Success status
    """
    try:
        db = get_db_connection()
        if db is None:
            # In-memory fallback
            user_doc = _voice_chat_store.get(user_email)
            if not user_doc:
                return False
            if session_id:
                for s in user_doc.get("sessions", []):
                    if s.get("session_id") == session_id:
                        s["messages"] = []
                        return True
                return False
            else:
                del _voice_chat_store[user_email]
                return True

        # Get the voice_chat collection
        voice_chat_collection = db[Config.MONGODB_VOICE_CHAT_COLLECTION]

        if session_id:
            # Clear only the specified session
            result = voice_chat_collection.update_one(
                {"user_email": user_email, "sessions.session_id": session_id},
                {"$set": {"sessions.$.messages": []}}
            )
            return result.modified_count > 0
        else:
            # Delete the user's entire chat history
            result = voice_chat_collection.delete_one({"user_email": user_email})
            return result.deleted_count > 0
    except Exception:
        return False


def save_active_session(user_email, session_id, mode, subject):
    """Save or update the user's active session.
    
    Args:
        user_email (str): The user's email identifier
        session_id (str): Session ID to save as active
        mode (str): The mode of the session (tutor, conversation, etc.)
        subject (str): The subject of the session
        
    Returns:
        bool: Success status
    """
    try:
        db = get_db_connection()
        # In-memory fallback when DB is not available
        if db is None:
            _active_sessions_store[user_email] = {
                "session_id": session_id,
                "mode": mode,
                "subject": subject,
                "last_active": datetime.utcnow().isoformat(),
                "user_email": user_email,
                "created_at": datetime.utcnow().isoformat()
            }
            return True

        # Verify the collection name is set
        collection_name = Config.MONGODB_ACTIVE_SESSIONS_COLLECTION
        if not collection_name:
            return False

        # Get the active_sessions collection
        active_sessions_collection = db[collection_name]

        # Check if user already has an active session
        existing_session = active_sessions_collection.find_one({"user_email": user_email})

        session_data = {
            "session_id": session_id,
            "mode": mode,
            "subject": subject,
            "last_active": datetime.utcnow().isoformat()
        }

        if existing_session:
            # Update existing active session
            result = active_sessions_collection.update_one(
                {"user_email": user_email},
                {"$set": session_data}
            )
            success = result.modified_count > 0

            return success
        else:
            # Create new active session record
            session_data["user_email"] = user_email
            session_data["created_at"] = datetime.utcnow().isoformat()
            result = active_sessions_collection.insert_one(session_data)
            success = result.inserted_id is not None

            return success
    except Exception:
        return False


def get_active_session(user_email):
    """Get the user's active session if any.
    
    Args:
        user_email (str): The user's email identifier
        
    Returns:
        dict: Session data or None if no active session
    """
    try:
        db = get_db_connection()
        if db is None:
            # In-memory fallback
            return _active_sessions_store.get(user_email)

        # Verify the collection name is set
        collection_name = Config.MONGODB_ACTIVE_SESSIONS_COLLECTION
        if not collection_name:
            return None

        # Get the active_sessions collection
        active_sessions_collection = db[collection_name]

        # Find active session for user
        active_session = active_sessions_collection.find_one({"user_email": user_email})

        if active_session:
            return active_session
        else:
            return None
    except Exception:
        return None


def end_active_session(user_email):
    """End the user's active session.
    
    Args:
        user_email (str): The user's email identifier
        
    Returns:
        bool: Success status
    """
    try:
        db = get_db_connection()
        if db is None:
            # In-memory fallback
            if user_email in _active_sessions_store:
                del _active_sessions_store[user_email]
                return True
            return False

        # Verify the collection name is set
        collection_name = Config.MONGODB_ACTIVE_SESSIONS_COLLECTION
        if not collection_name:
            return False

        # Get the active_sessions collection
        active_sessions_collection = db[collection_name]

        # Remove active session for user
        result = active_sessions_collection.delete_one({"user_email": user_email})

        success = result.deleted_count > 0

        return success
    except Exception:
        return False


def format_chat_history_for_context(messages):
    """Format chat history into a string for AI context.
    
    Args:
        messages (list): List of message objects
    
    Returns:
        str: Formatted chat history
    """
    if not messages:
        return ""
        
    formatted_history = "Previous conversation:\n"
    
    for msg in messages:
        speaker = "AI" if msg.get("is_ai", False) else "User"
        content = msg.get("content", "")
        formatted_history += f"{speaker}: {content}\n"
    
    return formatted_history


def _optimize_for_voice(text):
    """Optimize text for voice playback by removing or replacing content that might not work well in speech.
    
    Args:
        text (str): Original response text
        
    Returns:
        str: Optimized text for voice synthesis
    """
    # Replace markdown code blocks with simplified indicators
    import re
    
    # Remove markdown code block syntax and keep the content
    text = re.sub(r'```[\w]*\n', 'Code example: ', text)
    text = re.sub(r'```', '', text)
    
    # Replace markdown formatting
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # Remove bold
    text = re.sub(r'\*(.*?)\*', r'\1', text)      # Remove italic
    text = re.sub(r'__(.*?)__', r'\1', text)      # Remove underline
    text = re.sub(r'~~(.*?)~~', r'\1', text)      # Remove strikethrough
    
    # Replace bullet points and numbered lists with pauses and vocal cues
    text = re.sub(r'^\s*[-*]\s+', 'Bullet point: ', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*(\d+)\.', r'Point \1:', text, flags=re.MULTILINE)
    
    # Replace URLs with something more speech-friendly
    text = re.sub(r'https?://\S+', 'a website link', text)
    
    # Replace excessive whitespace
    text = re.sub(r'\n\s*\n', '\n', text)
    
    # Handle math expressions (simplified approach)
    text = re.sub(r'\$\$(.*?)\$\$', r'mathematical formula: \1', text, flags=re.DOTALL)
    text = re.sub(r'\$(.*?)\$', r'mathematical expression: \1', text)
    
    # Handle special characters
    text = text.replace('&', 'and')
    text = text.replace('>', 'greater than')
    text = text.replace('<', 'less than')
    text = text.replace('==', 'equals')
    text = text.replace('!=', 'not equal to')
    text = text.replace('>=', 'greater than or equal to')
    text = text.replace('<=', 'less than or equal to')
    
    # Break very long sentences into smaller segments for better voice delivery
    MAX_SENTENCE_LENGTH = 150
    sentences = re.split(r'([.!?])', text)
    processed_sentences = []
    
    current_sentence = ""
    for i in range(0, len(sentences), 2):
        if i+1 < len(sentences):
            sentence = sentences[i] + sentences[i+1]
        else:
            sentence = sentences[i]
            
        if len(current_sentence) + len(sentence) > MAX_SENTENCE_LENGTH:
            processed_sentences.append(current_sentence)
            current_sentence = sentence
        else:
            current_sentence += sentence
    
    if current_sentence:
        processed_sentences.append(current_sentence)
    
    return ' '.join(processed_sentences)


def _get_fallback_response(prompt, context=None, error=None):
    """Generate a fallback response when the AI service fails.
    
    Args:
        prompt (str): The original user prompt
        context (dict, optional): Context from the original request
        error (str, optional): Error message that caused the failure
        
    Returns:
        str: A graceful fallback response
    """
    mode = context.get('mode', 'tutor') if context else 'tutor'
    subject = context.get('subject', 'general') if context else 'general'
    is_voice_input = context.get('is_voice_input', False) if context else False
    
    # Log detailed error for debugging
    
    
    # Create a contextual fallback response
    if is_voice_input:
        # Shorter, more direct response for voice
        return f"I'm sorry, I couldn't process your request about {subject} properly. Could you please try asking again or rephrasing your question?"
    else:
        # More detailed response for text
        return f"""I apologize, but I'm having trouble generating a response about {subject} right now. 

This might be due to a temporary issue with the AI service. Here's what you can try:

1. Ask your question again
2. Try rephrasing your question
3. Break complex questions into simpler parts
4. Try again in a few moments

I'm here to help with your {subject} questions when the service is working properly again."""

def init_vertex_ai():
    """Initialize the Vertex AI client."""
    try:
        # Lazy import Vertex SDK and relevant classes
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel, Part
            from vertexai.preview.generative_models import GenerationConfig, HarmCategory, HarmBlockThreshold
        except Exception:
            return False

        # Get credentials from environment or config
        project_id = Config.GOOGLE_CLOUD_PROJECT
        location = Config.GOOGLE_CLOUD_LOCATION
        credentials_base64 = Config.VERTEX_DEFAULT_CREDENTIALS

        # Convert base64 to credentials
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(base64.b64decode(credentials_base64))
        )

        vertexai.init(project=project_id, location=location, credentials=credentials)
        return True
    except Exception:
        return False


def get_vertex_response(prompt, context=None):
    """Generate a response using Vertex AI optimized for voice interaction.
    
    Args:
        prompt (str): The user's input text
        context (dict, optional): Additional context like mode, subject, is_voice_input, etc.
    
    Returns:
        str: The AI-generated response optimized for voice playback
    """
    # Try to lazy-initialize Vertex AI
    if not init_vertex_ai():
        return _get_fallback_response(prompt, context, error="Vertex AI SDK not available")

    # Default model to use - Gemini 2.5 Flash
    model_name = Config.VERTEX_MODEL_NAME
    try:
        from vertexai.generative_models import GenerativeModel
        from vertexai.preview.generative_models import GenerationConfig, HarmCategory, HarmBlockThreshold

        model = GenerativeModel(model_name)
        
        # Check if this is a voice interaction
        is_voice_input = context.get('is_voice_input', False) if context else False
        
        # Prepare system instructions based on context
        system_instruction = _build_system_instruction(context)
        
        # Add chat history context if provided
        user_email = context.get('user_email') if context else None
        session_id = context.get('session_id') if context else None
        conversation_history = ""
        
        if user_email and session_id:
            # Get more context for text, less for voice to keep responses concise
            history_limit = 10
            # Pass session_id to get chat history only for current session
            chat_history = get_chat_history(user_email, history_limit, session_id)
            if chat_history:
                conversation_history = format_chat_history_for_context(chat_history)
        
        # Include conversation history in the prompt if available
        if conversation_history:
            # Combine system instruction, conversation history, and current prompt
            full_prompt = [system_instruction, conversation_history, prompt]
        else:
            full_prompt = [system_instruction, prompt]
        
        # Configure safety settings and generation config
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }

        generation_config = GenerationConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=600 if is_voice_input else 1024,
        )
        
        # Generate the response
        response = model.generate_content(
            full_prompt,
            generation_config=generation_config,
            safety_settings=safety_settings,
        )
        
        response_text = response.text.strip()
        
        # Optimize for voice if needed
        if is_voice_input:
            # Clean up response for better voice playback
            response_text = _optimize_for_voice(response_text)
        
        # Save messages to chat history if user_email is provided
        if user_email:
            # Save user message with context
            save_chat_message(user_email, prompt, is_ai=False, context=context)
            # Save AI response with context
            save_chat_message(user_email, response_text, is_ai=True, context=context)
        
        # Return the text response
        return response_text
    except Exception as e:
        
        # Return a graceful fallback response instead of raising
        return _get_fallback_response(prompt, context, error=str(e))


def _build_system_instruction(context):
    """Build a system instruction based on context with voice optimization."""
    if not context:
        return "You are a helpful AI tutor. Keep responses clear and concise."
    
    mode = context.get('mode', 'tutor')
    subject = context.get('subject', 'general')
    is_welcome = context.get('is_welcome', False)
    is_error_state = context.get('is_error_state', False)
    is_goodbye = context.get('is_goodbye', False)
    voice_enabled = context.get('voice_enabled', None)
    is_voice_input = context.get('is_voice_input', False)
    
    # Voice-specific instruction additions
    voice_optimizations = ""
    if is_voice_input:
        voice_optimizations = """
        Since this response will be converted to speech:
        - Use shorter sentences and simpler vocabulary
        - Avoid complex symbols, tables, or visual elements
        - Limit use of parentheses and special characters
        - Use verbal cues instead of visual formatting
        - Keep responses concise and well-structured for listening
        - Use conversational language that sounds natural when spoken
        """
    
    if is_error_state:
        return ("You are a helpful AI tutor. The user is experiencing technical difficulties. "
                f"Provide a supportive response for the {mode} mode about {subject}. "
                "Keep your response brief and encouraging." + 
                (voice_optimizations if is_voice_input else ""))
    
    if is_welcome:
        return (f"You are a helpful AI tutor in {mode} mode focusing on {subject}. "
                "Generate a warm, engaging welcome message to start the session. "
                "Keep it concise (2-3 sentences) and set expectations for what the user will learn." +
                (voice_optimizations if is_voice_input else ""))
    
    if is_goodbye:
        return ("You are a helpful AI tutor ending a session. "
                "Generate a brief, warm closing message thanking the user for their time. "
                "Keep it concise (1-2 sentences) and encouraging for future learning." +
                (voice_optimizations if is_voice_input else ""))
    
    if voice_enabled is not None:
        state = "enabled" if voice_enabled else "disabled"
        return (f"You are a helpful AI tutor informing the user that voice output has been {state}. "
                f"Generate a brief, friendly message (1 sentence) telling them that voice is now {state}.")
    
    # General system instructions based on mode
    if mode == 'tutor':
        return (f"You are an expert tutor specializing in {subject}. "
                "Provide clear, step-by-step explanations that are educational and helpful. "
                "Use examples to illustrate concepts. Be encouraging and supportive. "
                "Your responses should be thorough but concise and focused on teaching." +
                (voice_optimizations if is_voice_input else ""))
    
    elif mode == 'conversation':
        return (f"You are a conversation partner interested in discussing {subject}. "
                "Be engaging, curious, and thoughtful in your responses. "
                "Ask follow-up questions to encourage deeper exploration of ideas. "
                "Your tone should be conversational and friendly." +
                (voice_optimizations if is_voice_input else ""))
    
    elif mode == 'debate':
        return (f"You are a debate partner helping the user explore different perspectives on {subject}. "
                "Present balanced viewpoints and counterarguments to help the user think critically. "
                "Challenge assumptions respectfully and provide evidence-based reasoning. "
                "Encourage the user to develop and defend their own positions." +
                (voice_optimizations if is_voice_input else ""))
    
    elif mode == 'interview':
        return (f"You are an interview coach helping the user prepare for questions about {subject}. "
                "Ask relevant interview questions and provide constructive feedback on their responses. "
                "Offer suggestions for improvement and highlight strengths. "
                "Your tone should be professional but supportive." +
                (voice_optimizations if is_voice_input else ""))
    
    else:
        return (f"You are a helpful AI assistant focused on {subject}. "
                "Provide clear, informative responses to the user's questions. "
                "Be concise, accurate, and helpful." +
                (voice_optimizations if is_voice_input else ""))


def summarize_text(text: str):
    """Return structured summary of input text using Vertex AI."""
    # Initialize Vertex AI
    if not init_vertex_ai():
        raise RuntimeError("Vertex SDK not available")

    try:
        from vertexai.generative_models import GenerativeModel
        model = GenerativeModel("gemini-pro")
        prompt = f"Please summarize the following text concisely, highlighting the key points:\n\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception:
        raise


def generate_images(prompts):
    """Generate images based on prompts using Vertex AI's image generation capabilities."""
    # Initialize Vertex AI
    if not init_vertex_ai():
        raise RuntimeError("Vertex SDK not available")

    try:
        from vertexai.generative_models import GenerativeModel
        model = GenerativeModel("imagegeneration@002")
        results = []
        for prompt in prompts:
            response = model.generate_content(prompt)
            if response.parts:
                for part in response.parts:
                    if hasattr(part, 'inline_data') and part.inline_data.mime_type.startswith('image/'):
                        results.append({
                            'prompt': prompt,
                            'mime_type': part.inline_data.mime_type,
                            'data': part.inline_data.data
                        })
        return results
    except Exception:
        raise
