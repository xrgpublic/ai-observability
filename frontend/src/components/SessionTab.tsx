"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Message, BotInfo, Checkpoint } from "@/types"

interface SessionTabProps {
  selectedBot: BotInfo | null
  selectedCheckpoint: number | null
  messages?: Message[]
  onSendMessage: (content: string) => void
  onEndSession: () => void
  onStartSession: () => void
}


export function SessionTab({
  selectedBot,
  selectedCheckpoint,
  messages = [],
  onStartSession,
  onSendMessage,
  onEndSession
}: SessionTabProps) {
  const [inputMessage, setInputMessage] = useState("")
  const [isSessionStarted, setIsSessionStarted] = useState(false)

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim())
      setInputMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleStartSession = () => {
    onStartSession();
    setIsSessionStarted(true);
  }

  const handleEndSession = () => {
    onEndSession();
    setIsSessionStarted(false);
  }

  if (!selectedBot) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a bot to start chatting
      </div>
    )
  }

  if (!isSessionStarted) {
    return (
      <div className="flex items-center justify-center h-full">
        <Button
          onClick={handleStartSession}
          variant="default"
          size="lg"
          className="px-8"
        >
          Start Session
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-4 border-b">
        <Button
          onClick={handleEndSession}
          variant="destructive"
          className="w-32"
        >
          End Session
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start a conversation!
            </div>
          ) : (
            messages.map((message, index) => (
              <Card
                key={index}
                className={`${
                  message.role === "user" ? "ml-auto bg-primary/10" : "mr-auto bg-muted"
                } max-w-[80%]`}
              >
                <CardContent className="p-3">
                  <div className="text-sm font-medium mb-1">
                    {message.role === "user" ? "You" : selectedBot?.name || "Assistant"}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="min-h-[60px]"
          />
          <Button 
            onClick={handleSendMessage}
            size="icon"
            className="h-[60px] w-[60px]"
            disabled={!inputMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}