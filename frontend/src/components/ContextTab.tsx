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
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const WORKSPACE_URL = "http://127.0.0.1:5000/api/v1"

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
  handleSave,
}: ContextTabProps) {
  // ---------------------------------------
  // 1) Gather all messages that may contain images
  //    (system prompt, datasets, memories, messages)
  // ---------------------------------------
  const getAllMessages = React.useCallback(() => {
    const allMessages: any[] = []

    // System prompt as one "message"
    if (contextWindowData.system_prompt) {
      allMessages.push({ role: "system", content: contextWindowData.system_prompt })
    }

    // Datasets
    if (Array.isArray(contextWindowData.datasets)) {
      contextWindowData.datasets.forEach((dataset) => {
        if (Array.isArray(dataset.messages)) {
          allMessages.push(...dataset.messages)
        }
      })
    }

    // Memories
    if (Array.isArray(contextWindowData.memories)) {
      contextWindowData.memories.forEach((memSet) => {
        if (Array.isArray(memSet.messages)) {
          allMessages.push(...memSet.messages)
        }
      })
    }

    // Regular messages
    if (Array.isArray(contextWindowData.messages)) {
      allMessages.push(...contextWindowData.messages)
    }

    return allMessages
  }, [contextWindowData])

  // ---------------------------------------
  // 2) Top-level State for Storing Images
  // ---------------------------------------
  const [images, setImages] = React.useState<{ [key: string]: string | null }>({})

  // ---------------------------------------
  // 3) Single useEffect to Fetch Images 
  //    whenever checkpoint (contextWindowData) changes
  // ---------------------------------------
  React.useEffect(() => {
    let isMounted = true // to avoid setting state if unmounted

    const fetchImages = async () => {
      const newImages: { [key: string]: string | null } = {}
      const allMessages = getAllMessages()

      for (const msg of allMessages) {
        if (Array.isArray(msg.images)) {
          for (const imgName of msg.images) {
            const fileName = imgName.split("/").pop() || ""
            try {
              const res = await fetch(`${WORKSPACE_URL}/images/${fileName}`)
              if (res.ok) {
                const blob = await res.blob()
                newImages[imgName] = URL.createObjectURL(blob)
              } else {
                console.error(`Failed to fetch image ${fileName}: ${res.statusText}`)
              }
            } catch (error) {
              console.error(`Error fetching image ${fileName}:`, error)
            }
          }
        }
      }

      if (isMounted) {
        setImages(newImages)
      }
    }

    fetchImages()

    // Cleanup: Revoke all old object URLs on unmount
    return () => {
      isMounted = false
      Object.values(images).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [getAllMessages])

  // ---------------------------------------
  // 4) Helper to Render Messages (with images)
  // ---------------------------------------
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
                "bg-blue-100": message.role === "assistant",
              })}
            >
              <p className="text-sm font-semibold capitalize">{message.role}</p>
              <p className="text-sm text-gray-800">
                <ReactMarkdown
                  className="prose max-w-3xl break-words"
                  remarkPlugins={[remarkGfm]}
                  children={message.content}
                />
              </p>
              {/* Render Images if Present */}
              {message.images && Array.isArray(message.images) && message.images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {message.images.map((imgName: string) => (
                    <div key={imgName}>
                      {images[imgName] ? (
                        <img
                          src={images[imgName]!}
                          alt={`Message image ${imgName}`}
                          className="w-full h-auto rounded-md"
                          loading="lazy"
                        />
                      ) : (
                        <p>Loading...</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  )

  // ---------------------------------------
  // 5) Render the Rest of the Original UI
  // ---------------------------------------
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
                // Our single "system" message
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
