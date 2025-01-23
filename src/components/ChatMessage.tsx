import ReactMarkdown from 'react-markdown';

interface Message {
  message: {
    content: string;
    type: 'human' | 'ai';
  };
}

export const ChatMessage = ({ message }: { message: Message }) => {
  const isAI = message.message.type === 'ai';
  
  return (
    <div className={`p-4 ${isAI ? 'bg-chat-darker' : 'bg-chat-dark'} animate-fade-in`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAI ? 'bg-chat-accent' : 'bg-chat-gray'
          }`}>
            {isAI ? '🤖' : '👤'}
          </div>
          <div className="flex-1 text-chat-text">
            {isAI ? (
              <ReactMarkdown className="prose prose-invert">
                {message.message.content}
              </ReactMarkdown>
            ) : (
              <p>{message.message.content}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};