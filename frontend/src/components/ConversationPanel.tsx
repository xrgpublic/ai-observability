import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;       // The textual content
  timestamp: Date;
  status?: 'complete' | 'streaming';
  code?: string;         // The code snippet (if assistant)
  codeType?: string;     // Type of code (html, javascript, css, mixed)
  explanation?: string;  // If you need it
}

interface ConversationPanelProps {
  onExecuteAction?: (action: string) => void;
}

export function ConversationPanel({ onExecuteAction }: ConversationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);

  // We’ll store the generated code separately so we can preview it in an iframe.
  const [previewCode, setPreviewCode] = useState('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (!recognition.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognition.current.stop();
    } else {
      recognition.current.start();
    }
    setIsListening(!isListening);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    // 1) Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    setIsProcessing(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      // 2) Send to backend
      const response = await fetch(`${apiUrl}/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      // data should look like { request: "some text", searchNeeded: false, code: "<div>some code</div>", codeType: "html" }

      // 3) Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.request || '',  // or a short summary
        code: data.code || '',
        codeType: data.codeType || 'mixed',
        timestamp: new Date(),
        status: 'complete'
      };
      setMessages(prev => [...prev, assistantMessage]);

      // 4) If searchNeeded === true, you might do a second fetch, but you said you’ll handle that logic later.

      // 5) Show code in an iframe
      if (data.code) {
        setPreviewCode(data.code);
      }
    } catch (error) {
      console.error('Error:', error);
      // Show error message from assistant
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.push({
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
          timestamp: new Date(),
          status: 'complete',
        });
        return newMessages;
      });
    } finally {
      setInput('');
      setIsProcessing(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] p-4">
      <div className="text-xl font-bold mb-4">Conversation</div>
      <ScrollArea className="flex-grow mb-4 p-4 border rounded-md">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'mb-4',
              message.role === 'user' ? 'text-right' : 'text-left'
            )}
          >
            <div
              className={cn(
                'inline-block p-3 rounded-lg max-w-[80%]',
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              )}
            >
              <div>{message.content}</div>

              {/* Show code if present */}
              {message.code && (
                <div className="mt-2 p-2 bg-gray-900 text-gray-100 rounded overflow-x-auto">
                  <div className="text-xs text-gray-400 mb-1">
                    {message.codeType || 'code'}
                  </div>
                  <pre className="text-sm">
                    <code>{message.code}</code>
                  </pre>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Iframe Preview - only show for HTML or mixed code */}
      {previewCode && (messages[messages.length - 1].codeType === 'html' || messages[messages.length - 1].codeType === 'mixed') && (
        <div className="border p-2 mb-4 h-40 overflow-hidden">
          <iframe
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin"
            srcDoc={previewCode}
            title="Code Preview"
          />
        </div>
      )}

      {/* Input Row */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleListening}
          className={cn(isListening && 'bg-red-500 text-white')}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={isProcessing}
          className="flex-1"
        />
        <Button 
          onClick={handleSend} 
          disabled={isProcessing}
          className="min-w-[40px]"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
}
