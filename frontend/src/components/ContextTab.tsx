"use client"

import * as React from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Flag, Brain, Edit, Save, Info, MessageSquare } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import classNames from "classnames"
import { ContextWindowData } from "@/types"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ContextTabProps {
  contextWindowData: ContextWindowData
  contextSummary: string | null
  showChainOfThought: boolean
  setShowChainOfThought: (val: boolean) => void
  editMode: boolean
  handleEdit: () => void
  handleSave: () => void
}

export function ContextTab({
  contextWindowData,
  contextSummary,
  showChainOfThought,
  setShowChainOfThought,
  editMode,
  handleEdit,
  handleSave
}: ContextTabProps) {
  
  const renderMessages = (messages: any[], icon: React.ReactNode) => (
    <>
      {messages.map((message, index) => (
        <div key={index} className="mb-2 last:mb-0">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">{icon}</div>
            <div
              className={classNames("p-2 rounded-md", {
                "bg-purple-100": message.role === "system",
                "bg-green-100": message.role === "user",
                "bg-blue-100": message.role === "assistant"
              })}
            >
              <p className="text-sm font-semibold capitalize">{message.role}</p>
              <p className="text-sm text-gray-800 "> <ReactMarkdown className="prose max-w-3xl break-words"
        remarkPlugins={[remarkGfm]} 
        children={message.content} 
      /></p>
            </div>
          </div>
        </div>
      ))}
    </>
  )

  return (
    <Card className="bg-green-50/50 dark:bg-green-900/30 transition-colors">
      <CardHeader className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4" />
          <CardTitle className="text-lg font-semibold">Context Window</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" onClick={() => setShowChainOfThought(!showChainOfThought)}>
                <Brain className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Chain-of-Thought (Debugging)</TooltipContent>
          </Tooltip>
          {editMode ? (
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          ) : (
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-gray-700 dark:text-gray-200">
          <strong>Summary:</strong> {contextSummary ? contextSummary : "No summary available."}
        </div>
        <ScrollArea className="min-h-[300px] max-h-[80vh] w-full rounded-md border p-4 dark:border-gray-700 overflow-y-auto">
          <div className="space-y-4 text-gray-800 dark:text-gray-100">
            {/* System Prompt */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                System Prompt
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    High-level instructions for the assistant.
                  </TooltipContent>
                </Tooltip>
              </h3>
              {renderMessages(
                [{ role: "system", content: contextWindowData.system_prompt }],
                <Flag className="h-4 w-4 mt-1 text-purple-500" />
              )}
            </div>
            <Separator />

            {/* Datasets */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                Datasets
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Reference material or data context for the conversation.
                  </TooltipContent>
                </Tooltip>
              </h3>
              {Array.isArray(contextWindowData.datasets) && contextWindowData.datasets.length > 0 ? (
                contextWindowData.datasets.map((dataset, index) => (
                  <React.Fragment key={index}>
                    {renderMessages(
                      dataset.messages,
                      <Flag className="h-4 w-4 mt-1 text-blue-500" />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-sm text-gray-500">No datasets available.</p>
              )}
            </div>
            <Separator />

            {/* Memories */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                Memories
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Long-term memory or previously stored context.
                  </TooltipContent>
                </Tooltip>
              </h3>
              {Array.isArray(contextWindowData.memories) && contextWindowData.memories.length > 0 ? (
                contextWindowData.memories.map((memSet, index) => (
                  <React.Fragment key={index}>
                    {renderMessages(memSet.messages, <Brain className="h-4 w-4 mt-1 text-green-500" />)}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-sm text-gray-500">No memories available.</p>
              )}
            </div>
            <Separator />

            {/* Messages */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                Messages
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    The ongoing conversation messages.
                  </TooltipContent>
                </Tooltip>
              </h3>
              {Array.isArray(contextWindowData.messages) && contextWindowData.messages.length > 0 ? (
                renderMessages(
                  contextWindowData.messages,
                  <MessageSquare className="h-4 w-4 mt-1 text-orange-500" />
                )
              ) : (
                <p className="text-sm text-gray-500">No messages available.</p>
              )}
            </div>

            {/* Chain-of-Thought */}
            {showChainOfThought && (
              <div className="mt-4 p-2 bg-yellow-100 dark:bg-yellow-800 rounded">
                <h3 className="text-sm font-bold">Chain-of-Thought (Debug)</h3>
                <p className="text-sm">[Hidden reasoning steps would appear here]</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
