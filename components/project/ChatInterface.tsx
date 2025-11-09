'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import type { ChatMessage } from '@/types/chat'

interface ChatInterfaceProps {
  projectId: string
  roadmapSummary?: string
  onTicketsGenerated?: (ticketCount: number) => void
}

export default function ChatInterface({
  projectId,
  roadmapSummary,
  onTicketsGenerated,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    generateTickets,
    conversationHistory,
    isGenerating,
    loadChatHistory,
  } = useChat(projectId)

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory()
  }, [projectId, loadChatHistory])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || isGenerating) return

    const userMessage = message.trim()
    setMessage('')

    const response = await generateTickets(userMessage)
    if (response && response.suggestedTickets.length > 0) {
      onTicketsGenerated?.(response.suggestedTickets.length)
    }
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Roadmap Summary Box */}
      {roadmapSummary && (
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Roadmap Summary
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {roadmapSummary}
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="px-6 py-4 min-h-[400px] max-h-[600px] overflow-y-auto">
        {conversationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-gray-500 dark:text-gray-400">
            <Bot className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm mb-2">Start a conversation to generate tickets.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Try: "Add authentication feature with OAuth2"
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {conversationHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-4 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Claude Style */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Generate tickets or modify the roadmap..."
              rows={3}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!message.trim() || isGenerating}
              className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

