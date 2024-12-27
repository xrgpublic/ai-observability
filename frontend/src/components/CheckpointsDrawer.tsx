"use client"
import classNames from "classnames"
import { Flag, ChevronDown, Edit, Save, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Checkpoint } from "@/types"

interface CheckpointsDrawerProps {
  isCheckpointsDrawerOpen: boolean
  setIsCheckpointsDrawerOpen: (open: boolean) => void
  checkpoints: Checkpoint[]
  selectedCheckpoint: number | null
  handleSelectCheckpoint: (checkpointId: number) => void
  handleDeleteCheckpoint: () => void
  editMode: boolean
  handleEdit: () => void
  handleSave: () => void
}

export function CheckpointsDrawer({
  isCheckpointsDrawerOpen,
  setIsCheckpointsDrawerOpen,
  checkpoints,
  selectedCheckpoint,
  handleSelectCheckpoint,
  handleDeleteCheckpoint,
  editMode,
  handleEdit,
  handleSave
}: CheckpointsDrawerProps) {
  return (
    <div
      className={classNames(
        "fixed top-0 right-0 h-full w-full md:w-80 bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 transform transition-transform duration-300 ease-in-out overflow-auto z-50",
        {
          "translate-x-0": isCheckpointsDrawerOpen,
          "translate-x-full": !isCheckpointsDrawerOpen
        }
      )}
    >
      <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4" />
          <h2 className="font-semibold text-lg">Checkpoints</h2>
        </div>
        <Button variant="ghost" onClick={() => setIsCheckpointsDrawerOpen(false)}>
          <ChevronDown className="h-4 w-4 rotate-90" />
        </Button>
      </div>
      <div className="p-4">
        <ScrollArea className="min-h-[200px] max-h-[80vh] w-full rounded-md border p-4 dark:border-gray-700">
          {checkpoints.length > 0 ? (
            checkpoints.map((checkpoint) => (
              <div
                key={checkpoint.id}
                className={`mb-2 last:mb-0 p-2 rounded cursor-pointer transition-colors ${
                  selectedCheckpoint === checkpoint.id
                    ? "bg-blue-50 dark:bg-blue-800 border-blue-500"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => handleSelectCheckpoint(checkpoint.id)}
              >
                <p className="text-sm text-gray-800 dark:text-gray-100">
                  <strong>ID:</strong> {checkpoint.id}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Checkpoint #:</strong> {checkpoint.checkpoint_number}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Status:</strong> {checkpoint.version}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Date:</strong> {checkpoint.created_at}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No checkpoints available.</p>
          )}
        </ScrollArea>
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
          {selectedCheckpoint && (
            <Button onClick={handleDeleteCheckpoint} className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
        <div className="mt-4">
          <Button variant="outline" className="w-full">
            Compare Checkpoints (coming soon)
          </Button>
        </div>
      </div>
    </div>
  )
}
