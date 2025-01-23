import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Menu } from 'lucide-react';

interface Conversation {
  session_id: string;
  title: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(uuidv4());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        setMessages((current) => [...current, payload.new]);
      })
      .subscribe();

    // Fetch existing messages for the session
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setMessages(data || []);
    };

    // Fetch conversations
    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('session_id, message')
        .order('created_at', { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Group by session_id and get first human message as title
      const conversationsMap = new Map();
      data.forEach((msg) => {
        if (!conversationsMap.has(msg.session_id) && msg.message.type === 'human') {
          conversationsMap.set(msg.session_id, {
            session_id: msg.session_id,
            title: msg.message.content.slice(0, 100),
          });
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    };

    fetchMessages();
    fetchConversations();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, toast]);

  const handleSendMessage = async (content: string) => {
    setLoading(true);
    const requestId = uuidv4();

    // First, insert the human message into Supabase
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        message: {
          type: 'human',
          content: content
        }
      });

    if (insertError) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://b70a4ba1-5ec4-4f8e-b93c-2e78977f115a.lovableproject.com/api/pydantic-github-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content,
          user_id: 'NA',
          request_id: requestId,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Request failed');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (sid: string) => {
    setSessionId(sid);
    setMessages([]);
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="h-screen flex bg-chat-dark">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} bg-chat-darker border-r border-chat-gray transition-all duration-300 overflow-hidden`}>
        <div className="p-4">
          <Button
            onClick={() => {
              setSessionId(uuidv4());
              setMessages([]);
            }}
            className="w-full bg-chat-accent hover:bg-chat-accent/90 mb-4"
          >
            New Chat
          </Button>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Button
                key={conv.session_id}
                onClick={() => handleConversationClick(conv.session_id)}
                variant="ghost"
                className={`w-full justify-start text-left text-chat-text hover:bg-chat-gray/50 ${
                  sessionId === conv.session_id ? 'bg-chat-gray/30' : ''
                }`}
              >
                {conv.title}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b border-chat-gray flex items-center">
          <Button
            onClick={() => setShowSidebar(!showSidebar)}
            variant="ghost"
            size="icon"
            className="text-chat-text hover:bg-chat-gray/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg.message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
};

export default Chat;