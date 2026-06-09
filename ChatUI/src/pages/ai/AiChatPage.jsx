import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/index.js';
import { Avatar } from '@/components/common/index.js';
import { aiApi } from '@/api/aiApi.js';
import { ArrowLeft, Languages, Bot, Send, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn.js';

const MAX_CHARS = 8000;

export const AiChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const charCount = inputText.length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading || text.length > MAX_CHARS) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      direction: null,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const aiMessageId = `ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        role: 'ai',
        content: '',
        direction: null,
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    try {
      const result = await aiApi.translate(text);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: result.translated,
                direction: result.direction,
                isLoading: false,
              }
            : msg
        )
      );
    } catch (error) {
      console.error('Translation error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: 'Dịch thất bại. Vui lòng thử lại.',
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    navigate('/chat');
  };

  const getDirectionLabel = (direction) => {
    if (!direction) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 border border-blue-200">
        <Languages className="h-3 w-3" />
        {direction}
      </span>
    );
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-white px-3 lg:px-4 py-3 lg:py-4">
        <button
          onClick={handleBack}
          className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation shrink-0"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0 shadow-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm lg:text-base font-semibold text-text-primary truncate">
              AI Dịch thuật
            </h2>
            <p className="text-xs text-text-secondary">
              Anh {'\u2194'} Việt
            </p>
          </div>
        </div>
      </div>

      {/* Welcome state */}
      {messages.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Languages className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            AI Phiên dịch viên
          </h3>
          <p className="max-w-xs text-sm text-text-secondary leading-relaxed">
            Nhập text tiếng Anh hoặc tiếng Việt để dịch. Tôi sẽ tự động nhận diện ngôn ngữ và dịch sang ngôn ngữ còn lại.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 lg:px-4 py-3 lg:py-4 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={cn(
                'flex items-end gap-2',
                isUser ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {isUser ? (
                <Avatar name={user?.displayName || 'U'} src={user?.avatarUrl} size="sm" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0 shadow-sm">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              )}

              <div
                className={cn(
                  'max-w-[75%] min-w-0',
                  isUser ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base leading-relaxed',
                    isUser
                      ? 'rounded-tr-sm bg-primary text-white'
                      : 'rounded-tl-sm bg-white border border-border text-text-primary'
                  )}
                >
                  {msg.content}
                  {msg.isLoading && (
                    <span className="ml-1 inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </span>
                  )}
                </div>

                {/* Direction badge and timestamp for AI messages */}
                {!isUser && (
                  <div className="mt-1 flex items-center gap-2">
                    {getDirectionLabel(msg.direction)}
                    <span className="text-xs text-text-secondary/60">
                      {msg.timestamp?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Timestamp for user messages */}
                {isUser && (
                  <div className="mt-1 text-right">
                    <span className="text-xs text-text-secondary/60">
                      {msg.timestamp?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-white px-3 lg:px-4 pt-3 pb-3 lg:pb-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập text để dịch..."
            rows={1}
            disabled={isLoading}
            className={cn(
              'min-h-[40px] lg:min-h-[44px] flex-1 resize-none rounded-xl border bg-gray-50 px-3 lg:px-4 py-2 text-sm lg:text-base',
              charCount > MAX_CHARS
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                : 'border-border focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading || charCount > MAX_CHARS}
            className={cn(
              'shrink-0 flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-xl transition-colors touch-manipulation',
              inputText.trim() && !isLoading && charCount <= MAX_CHARS
                ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p
          className={cn(
            'mt-1 text-right text-xs',
            charCount > MAX_CHARS ? 'text-red-500 font-medium' : 'text-text-secondary/50'
          )}
        >
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} ký tự
        </p>
      </div>
    </div>
  );
};
