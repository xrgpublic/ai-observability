"use client"

import classNames from "classnames"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User, Bot, Send, History } from "lucide-react"
import { ContextWindowData } from "@/types"

interface SessionTabProps {
  isChatActive: boolean
  contextWindowData: ContextWindowData
  currentMessage: string
  setCurrentMessage: (message: string) => void
  handleSendMessage: () => void
  handleStartSession: (isNewSession: boolean) => void
  handleEndSession: () => void
}

export function SessionTab({
  isChatActive,
  contextWindowData,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  handleStartSession,
  handleEndSession
}: SessionTabProps) {
  return (
    <div className="bg-orange-50/50 dark:bg-orange-900/30 transition-colors p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5" />
          Session History
        </h2>
      </div>

      {!isChatActive ? (
        <div className="space-y-4">
          <Button
            variant="default"
            onClick={() => handleStartSession(false)}
            className="w-full"
          >
            Continue Session
          </Button>
          <Button
            variant="default"
            onClick={() => handleStartSession(true)}
            className="w-full"
          >
            Start New Session
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Message History */}
          <ScrollArea className="h-[300px] w-full rounded-md border p-4 dark:border-gray-700">
            {contextWindowData.messages.length > 0 ? (
              contextWindowData.messages.map((message, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <div className="flex items-start gap-2">
                    {message.role === "user" ? (
                      <User className="h-5 w-5 mt-0.5 text-blue-500" />
                    ) : (
                      <Bot className="h-5 w-5 mt-0.5 text-green-500" />
                    )}
                    <div
                      className={classNames("p-2 rounded-md", {
                        "bg-green-100 dark:bg-green-800": message.role === "user",
                        "bg-blue-100 dark:bg-blue-800": message.role === "assistant"
                      })}
                    >
                      <p className="font-semibold text-sm capitalize text-gray-800 dark:text-gray-100">
                        {message.role === "user" ? "User" : "Assistant"}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No messages yet. Start chatting below.</p>
            )}
          </ScrollArea>

          {/* Input Box */}
          <div className="flex items-center gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message and press Enter..."
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage()
                }
              }}
            />
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* End Session Button */}
          <Button variant="default" onClick={handleEndSession} className="w-full">
            End Session
          </Button>
        </div>
      )}
    </div>
  )
}
