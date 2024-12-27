"use client"

import * as React from "react"
import { Bot, Save, Edit } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { BotInfo } from "@/types"

interface OverviewTabProps {
  botInfo: BotInfo
  setBotInfo: React.Dispatch<React.SetStateAction<BotInfo>>
  editMode: boolean
  handleEdit: () => void
  handleSave: () => void
  showFullText_default: boolean
  setShowFullText_default: (val: boolean) => void
  showFullText_current: boolean
  setShowFullText_current: (val: boolean) => void
  previewText_default: string
  previewText_current: string
  fullText_default: string
  fullText_current: string
}

export function OverviewTab({
  botInfo,
  setBotInfo,
  editMode,
  handleEdit,
  handleSave,
  showFullText_default,
  setShowFullText_default,
  showFullText_current,
  setShowFullText_current,
  previewText_default,
  previewText_current,
  fullText_default,
  fullText_current
}: OverviewTabProps) {
  return (
    <Card className="bg-sky-50/50 dark:bg-sky-900/30 transition-colors">
      <CardHeader className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <CardTitle className="text-lg font-semibold">Bot Info</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {editMode ? (
          <div className="space-y-4">
            <Input
              value={botInfo.name}
              onChange={(e) => setBotInfo((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Bot Name"
            />
            <Input
              value={botInfo.id.toString()}
              onChange={(e) =>
                setBotInfo((prev) => ({ ...prev, id: parseInt(e.target.value) || 0 }))
              }
              placeholder="Bot ID"
              type="number"
            />
            <Textarea
              value={botInfo.description}
              onChange={(e) => setBotInfo((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Bot Description"
            />
            <Textarea
              value={botInfo.default_system_prompt}
              onChange={(e) =>
                setBotInfo((prev) => ({ ...prev, default_system_prompt: e.target.value }))
              }
              placeholder="Default System Prompt"
            />
            <Textarea
              value={botInfo.system_prompt}
              onChange={(e) => setBotInfo((prev) => ({ ...prev, system_prompt: e.target.value }))}
              placeholder="System Prompt"
            />
            <Textarea
              value={botInfo.model}
              onChange={(e) => setBotInfo((prev) => ({ ...prev, model: e.target.value }))}
              placeholder="Model"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-gray-800">Bot Information</h2>
              <div className="space-y-2 text-gray-800 dark:text-gray-100 text-sm">
                <p>
                  <strong>Name:</strong>{" "}
                  {botInfo.name || <span className="text-gray-500">N/A</span>}
                </p>
                <p>
                  <strong>ID:</strong> {botInfo.id || <span className="text-gray-500">N/A</span>}
                </p>
                <p>
                  <strong>Model:</strong>{" "}
                  {botInfo.model || <span className="text-gray-500">N/A</span>}
                </p>
                <p>
                  <strong>Description:</strong>{" "}
                  {botInfo.description || <span className="text-gray-500">N/A</span>}
                </p>
              </div>
            </div>

            <div className="prompt-container bg-gray-100 border border-gray-300 p-4 rounded-md shadow-md">
              <h3 className="text-lg font-semibold text-gray-800">Default System Prompt:</h3>
              {showFullText_default ? (
                <MarkdownRenderer>{botInfo.default_system_prompt}</MarkdownRenderer>
              ) : (
                <MarkdownRenderer>{previewText_default}</MarkdownRenderer>
              )}
              {fullText_default.length > 150 && (
                <button
                  onClick={() => setShowFullText_default(!showFullText_default)}
                  className="text-blue-500 hover:underline"
                >
                  {showFullText_default ? "Show Less" : "Show More"}
                </button>
              )}
            </div>

            <div className="prompt-container bg-gray-100 border border-gray-300 p-4 rounded-md shadow-md mt-4 overflow-auto">
              <h3 className="text-lg font-semibold text-gray-800">Current System Prompt:</h3>
              {showFullText_current ? (
                <MarkdownRenderer>{fullText_current}</MarkdownRenderer>
              ) : (
                <MarkdownRenderer>{previewText_current}</MarkdownRenderer>
              )}
              {fullText_current.length > 150 && (
                <button
                  onClick={() => setShowFullText_current(!showFullText_current)}
                  className="text-blue-500 hover:underline"
                >
                  {showFullText_current ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
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
      </CardContent>
    </Card>
  )
}
