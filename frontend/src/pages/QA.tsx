import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { searchAPI } from '@/api/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Brain, 
  User, 
  Sparkles,
  History,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QAMessage {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
  sources?: string[];
}

const QA = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    // Load conversation history from localStorage
    const saved = localStorage.getItem('qaHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Failed to parse QA history:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Save conversation history to localStorage
    if (messages.length > 0) {
      localStorage.setItem('qaHistory', JSON.stringify(messages));
    }
  }, [messages]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion.trim() || isAsking) {
      return;
    }

    const question = currentQuestion.trim();
    setCurrentQuestion('');
    setIsAsking(true);

    // Add question to messages
    const questionMessage: QAMessage = {
      id: Date.now().toString(),
      type: 'question',
      content: question,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, questionMessage]);

    try {
      const response = await searchAPI.askQuestion(question);
      
      // Add AI response to messages
      const answerMessage: QAMessage = {
        id: (Date.now() + 1).toString(),
        type: 'answer',
        content: response.answer || 'I apologize, but I couldn\'t find relevant information to answer your question.',
        timestamp: new Date(),
        sources: response.sources || [],
      };
      
      setMessages(prev => [...prev, answerMessage]);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
      
      // Add error message
      const errorMessage: QAMessage = {
        id: (Date.now() + 1).toString(),
        type: 'answer',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAsking(false);
      // Refocus input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('qaHistory');
    toast({
      title: 'History Cleared',
      description: 'Conversation history has been cleared.',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const suggestedQuestions = [
    "What documents do we have about user authentication?",
    "Summarize the key points from our technical documentation",
    "How can I implement database connections?",
    "What are the best practices mentioned in our guides?",
  ];

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-knowledge-bg">
      <Navbar />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <span>AI Q&A Assistant</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Ask questions about your knowledge base - Gemini AI will find and synthesize answers from your documents
              </p>
            </div>
            
            {messages.length > 0 && (
              <Button
                variant="outline"
                onClick={clearHistory}
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear History</span>
              </Button>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <Card className="h-[600px] bg-knowledge-card border-knowledge-border shadow-soft flex flex-col">
          {/* Chat Header */}
          <CardHeader className="flex-shrink-0 border-b border-knowledge-border">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Brain className="h-5 w-5 text-ai-primary" />
              <span>Chat with your Knowledge Base</span>
            </CardTitle>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-ai-primary to-ai-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Welcome to AI Q&A
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Ask me anything about your documents and I'll provide intelligent answers based on your knowledge base.
                  </p>
                  
                  {/* Suggested Questions */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Try asking:</p>
                    <div className="grid gap-2">
                      {suggestedQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentQuestion(question)}
                          className="text-left justify-start h-auto p-3 text-sm"
                        >
                          "{question}"
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 ${
                        message.type === 'question' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'answer' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-ai-primary to-ai-secondary rounded-full flex items-center justify-center">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.type === 'question'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-accent'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-accent-foreground/20">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Sources:
                            </p>
                            <div className="space-y-1">
                              {message.sources.map((source, index) => (
                                <div key={index} className="text-xs text-muted-foreground">
                                  • {source}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      {message.type === 'question' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isAsking && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-ai-primary to-ai-secondary rounded-full flex items-center justify-center">
                        <Brain className="h-4 w-4 text-white animate-pulse" />
                      </div>
                      <div className="bg-accent rounded-lg p-4">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-knowledge-border p-4">
              <form onSubmit={handleAskQuestion} className="flex space-x-4">
                <Input
                  ref={inputRef}
                  placeholder="Ask me anything about your documents..."
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  disabled={isAsking}
                  className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={isAsking || !currentQuestion.trim()}
                  className="bg-gradient-to-r from-ai-primary to-ai-secondary hover:from-ai-primary/90 hover:to-ai-secondary/90 shadow-ai px-6"
                >
                  {isAsking ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              
              <p className="text-xs text-muted-foreground mt-2 text-center">
                AI responses are based on your knowledge base documents. Results may vary based on available content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QA;