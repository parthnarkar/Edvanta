import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Lightbulb,
  Plus,
  History,
  Trash2,
  X,
  Clock,
  LogIn
} from 'lucide-react'
import backEndURL from "../../hooks/helper";
import { useAuth } from "../../hooks/useAuth";

export function DoubtSolving() {
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [chatSessions, setChatSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  // Use authentication to get user email
  const { user, loading: authLoading } = useAuth()

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize the component when user authentication is ready
  useEffect(() => {
    if (!authLoading) {
      initializeChat()
    }
  }, [authLoading, user])

  const initializeChat = async () => {
    try {
      setIsLoading(true)
      if (user && user.email) {
        await loadChatSessions()
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadChatSessions = async () => {
    if (!user || !user.email) return
    
    try {
      const response = await fetch(`${backEndURL}/api/chat/loadChat?userEmail=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setChatSessions(data.sessions || [])
          if (data.currentSessionId) {
            setCurrentSessionId(data.currentSessionId)
            // Load messages from current session
            const currentSession = data.sessions.find(s => s.id === data.currentSessionId)
            if (currentSession && currentSession.messages) {
              setMessages(currentSession.messages || [])
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error)
    }
  }

  const createNewSession = async () => {
    if (!user || !user.email) return
    
    try {
      const now = new Date()
      const sessionName = `Chat ${now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })} at ${now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`
      
      const response = await fetch(`${backEndURL}/api/chat/createChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName: sessionName,
          userEmail: user.email
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setChatSessions(prev => [data.session, ...prev])
          setCurrentSessionId(data.session.id)
          setMessages([])
          setIsHistoryOpen(false)
        }
      }
    } catch (error) {
      console.error('Failed to create new session:', error)
    }
  }

  const switchToSession = async (sessionId) => {
    if (!user || !user.email) return
    
    try {
      setCurrentSessionId(sessionId)
      const session = chatSessions.find(s => s.id === sessionId)
      if (session) {
        setMessages(session.messages || [])
        
        // Update activity
        await fetch(`${backEndURL}/api/chat/updateActivity/${sessionId}/activity`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: user.email })
        })
      }
      setIsHistoryOpen(false)
    } catch (error) {
      console.error('Failed to switch session:', error)
    }
  }

  const deleteSession = async (sessionId) => {
    if (!user || !user.email) return
    
    try {
      const response = await fetch(`${backEndURL}/api/chat/deleteChat/${sessionId}?userEmail=${encodeURIComponent(user.email)}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setChatSessions(data.remainingSessions || [])
          if (sessionId === currentSessionId) {
            if (data.remainingSessions.length > 0) {
              setCurrentSessionId(data.remainingSessions[0].id)
              setMessages(data.remainingSessions[0].messages || [])
            } else {
              setCurrentSessionId(null)
              setMessages([])
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !user || !user.email) return

    const userMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString() // Temporary timestamp, will be updated with server timestamp
    }

    // Add user message to UI immediately
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    const questionToSend = currentMessage
    setCurrentMessage('')
    setIsTyping(true)

    try {
      // If no current session, create one
      let sessionId = currentSessionId
      if (!sessionId) {
        const now = new Date()
        const sessionName = `Chat ${now.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })} at ${now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}`
        
        const createResponse = await fetch(`${backEndURL}/api/chat/createChat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionName: sessionName,
            userEmail: user.email
          })
        })
        
        if (createResponse.ok) {
          const createData = await createResponse.json()
          if (createData.success) {
            sessionId = createData.session.id
            setCurrentSessionId(sessionId)
            setChatSessions(prev => [createData.session, ...prev])
          }
        }
      }

      // Send message to AI with conversation context (excluding the temporary user message we just added)
      const response = await fetch(`${backEndURL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: questionToSend,
          userEmail: user.email,
          chatHistory: messages, // Use original messages, not the updated ones
          sessionId: sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Use server timestamp for both user and AI messages
        const serverTimestamp = data.timestamp
        const updatedUserMessage = {
          ...userMessage,
          timestamp: serverTimestamp
        }
        
        const botResponse = {
          role: 'assistant',
          content: data.message,
          timestamp: serverTimestamp
        }

        // Replace the temporary user message with the server-timestamped one and add bot response
        const finalMessages = [...messages, updatedUserMessage, botResponse]
        setMessages(finalMessages)

        // Update the session in local state
        setChatSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, messages: finalMessages, messageCount: finalMessages.length, lastActivity: serverTimestamp }
            : session
        ))
      }
    } catch (error) {
      console.error('Error calling API:', error)
      
      // Fallback response with server-like timestamp
      const errorResponse = {
        role: 'assistant',
        content: `I'm sorry, I'm having trouble connecting to the server right now. However, I can see you're asking about "${questionToSend}". 

Here are some general tips:
1. **Break down the problem** - Try to identify the specific part you're struggling with
2. **Check the basics** - Make sure you understand the fundamental concepts  
3. **Look for examples** - Similar problems might help clarify the approach
4. **Practice step by step** - Work through the problem methodically

Please try again in a moment, and I'll be happy to provide a more detailed explanation!`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatUserContent = (content) => {
    // Simplified formatting for user messages with explicit white text
    return `<p class="text-white">${content.replace(/\n/g, '<br>')}</p>`;
  }

  const formatContent = (content) => {
    // Enhanced markdown formatting for AI responses
    return content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-blue-600">$1</code>')
      // Code blocks with language support
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto my-2"><code class="language-$1">$2</code></pre>')
      // Headings
      .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold my-2 text-gray-800">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold my-3 text-gray-800">$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold my-3 text-gray-900">$1</h1>')
      // Bullet points
      .replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^• (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^• (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>')
      // Numbered lists
      .replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      // Blockquotes
      .replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-3 italic text-gray-700 my-2">$1</blockquote>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline hover:text-blue-800">$1</a>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="my-3 border-t border-gray-300">')
      // Tables (simple support)
      .replace(/\n\n\|(.+)\|\n\|(?:[-:]+\|)+\n((.*\n)+?)\n/g, function(match, headers, rows) {
        const headerCells = headers.split('|').map(header => header.trim()).filter(Boolean);
        const headerRow = '<tr>' + headerCells.map(cell => `<th class="border p-2 bg-gray-100">${cell}</th>`).join('') + '</tr>';
        
        const tableRows = rows.trim().split('\n').map(row => {
          const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
          return '<tr>' + cells.map(cell => `<td class="border p-2">${cell}</td>`).join('') + '</tr>';
        }).join('');
        
        return `<div class="overflow-x-auto my-3"><table class="min-w-full border-collapse border border-gray-300"><thead>${headerRow}</thead><tbody>${tableRows}</tbody></table></div>`;
      })
      // Ensure paragraphs have proper spacing
      .replace(/\n\n/g, '</p><p class="my-2">')
      // Convert list items to proper lists
      .replace(/(<li[^>]*>.*?<\/li>)\s*(<li[^>]*>.*?<\/li>)/gs, function(match) {
        return '<ul class="my-2">' + match + '</ul>';
      })
      // Fix any unmatched paragraph tags
      .replace(/<\/p>(\s*)<p/g, '</p>$1<p')
      // Wrap content in paragraph if not already wrapped
      .replace(/^(.+)(?!\<\/p\>)$/gm, function(match) {
        if (!match.includes('<')) return `<p>${match}</p>`;
        return match;
      })
  }

  const formatExactTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time'
    
    try {
      const date = new Date(timestamp)
      
      // Format as: "Sep 4, 2025 at 2:34:56 PM"
      const dateOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
      
      const timeOptions = {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }
      
      const dateStr = date.toLocaleDateString('en-US', dateOptions)
      const timeStr = date.toLocaleTimeString('en-US', timeOptions)
      
      return `${dateStr} at ${timeStr}`
    } catch (error) {
      console.error('Error formatting timestamp:', error)
      return 'Invalid timestamp'
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-blue-600 mb-4 animate-pulse" />
          <p className="text-sm sm:text-base text-gray-600">Loading your doubt solving assistant...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-lg shadow-lg max-w-sm sm:max-w-md mx-auto w-full">
          <LogIn className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Please log in to access the AI Doubt Solving assistant. Your chat sessions will be saved and synced across all your devices.
          </p>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
            <p>✅ Persistent chat history</p>
            <p>✅ Cross-device synchronization</p>
            <p>✅ Context-aware conversations</p>
            <p>✅ Secure session management</p>
          </div>
          <Button 
            onClick={() => window.location.href = '/auth/login'} 
            className="w-full text-sm sm:text-base"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-white p-2 sm:p-3 lg:p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">AI Doubt Solving</h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 truncate">
                Welcome {user.displayName || user.email?.split('@')[0]}! Get instant help
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={createNewSession}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline text-xs sm:text-sm">New</span>
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline text-xs sm:text-sm">History</span>
              {chatSessions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 w-4 p-0 flex items-center justify-center">
                  {chatSessions.length > 99 ? '99+' : chatSessions.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 lg:space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center py-4 sm:py-6 lg:py-8 px-4">
              <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Ask any question and I'll help you understand it step by step.</p>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Your conversations are automatically saved to your account ({user.email?.split('@')[0]}...) and will persist across all your devices.
              </p>
            </div>
          )}

          {messages.map((message, index) => {
            // Define consistent sizes for avatar
            const avatarSizeClasses = "w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8";
            const avatarContentClasses = "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6";
            
            // Determine if message is from user or AI
            const isUserMessage = message.role === 'user';
            
            // Message bubble styles based on sender
            const messageBubbleClasses = `max-w-[90%] sm:max-w-[85%] lg:max-w-3xl p-2.5 sm:p-3 lg:p-4 rounded-lg ${
              isUserMessage 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border shadow-sm'
            }`;
            
            // Content styles based on sender
            const contentClasses = `prose prose-sm max-w-none text-xs sm:text-sm lg:text-base leading-relaxed ${
              isUserMessage 
                ? '!text-white' 
                : 'prose-headings:text-gray-800 prose-p:text-gray-700 prose-li:text-gray-700 prose-code:text-blue-600'
            }`;
            
            return (
              <div
                key={index}
                className={`flex gap-2 sm:gap-3 ${isUserMessage ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar - Only show for AI messages */}
                {!isUserMessage && (
                  <div className={`${avatarSizeClasses} bg-white rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gray-200 overflow-hidden`}>
                    <img 
                      src="/edvanta-logo.png" 
                      alt="Edvanta AI" 
                      className={`${avatarContentClasses} object-contain`}
                    />
                  </div>
                )}
                
                {/* Message Bubble */}
                <div className={messageBubbleClasses}>
                  {/* Message Content */}
                  <div
                    className={contentClasses}
                    dangerouslySetInnerHTML={{
                      __html: isUserMessage 
                        ? formatUserContent(message.content) 
                        : formatContent(message.content)
                    }}
                  />
                  
                  {/* Timestamp */}
                  {message.timestamp && (
                    <div className={`text-xs ${isUserMessage ? 'text-blue-100' : 'text-gray-400'} mt-1.5 sm:mt-2`}>
                      <div className="font-medium">
                        {formatExactTimestamp(message.timestamp)}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* User Avatar - Only show for user messages */}
                {isUserMessage && (
                  <div className={`${avatarSizeClasses} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-blue-200`}>
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || user.email?.split('@')[0] || 'User') + "&background=2563eb&color=ffffff";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm font-medium">
                          {(user?.displayName || user?.email)?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gray-200 overflow-hidden">
                <img 
                  src="/edvanta-logo.png" 
                  alt="Edvanta AI" 
                  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 object-contain"
                />
              </div>
              <div className="bg-white border rounded-lg p-2.5 sm:p-3 lg:p-4 shadow-sm">
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="ml-2 text-xs sm:text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white p-2 sm:p-3 lg:p-4 flex-shrink-0 shadow-lg">
          <div className="flex gap-2 sm:gap-3">
            <Input
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your question here..."
              className="flex-1 text-sm sm:text-base h-10 sm:h-11"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isTyping}
              className="px-3 sm:px-4 h-10 sm:h-11 flex-shrink-0"
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-white/20 backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Chat History</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsHistoryOpen(false)} className="hover:bg-white/20 h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-120px)] sm:max-h-96 bg-white/10 backdrop-blur-sm">
              {chatSessions.length === 0 ? (
                <div className="p-4 text-center text-gray-600 text-sm">
                  No chat sessions yet. Start a conversation to create your first session!
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 sm:p-4 border-b border-white/10 hover:bg-white/20 cursor-pointer flex items-center justify-between transition-all duration-200 ${
                      session.id === currentSessionId ? 'bg-blue-500/20 border-blue-400/30' : ''
                    }`}
                    onClick={() => switchToSession(session.id)}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-medium text-sm truncate text-gray-800">{session.name}</h4>
                      <p className="text-xs text-gray-600">
                        {session.messageCount || 0} messages
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {formatExactTimestamp(session.lastActivity)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100/30 h-8 w-8 p-0 flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}