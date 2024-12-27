"use client"
import { 
  Search, 
  ChevronDown, 
  Bot 
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Stack, BotInfo } from "@/types"

interface SearchPanelProps {
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchType: "bot" | "stack"
  setSearchType: (type: "bot" | "stack") => void
  filteredItems: (BotInfo | Stack)[]
  selectedBot: BotInfo | null
  handleSelectBot: (botId: number) => void
  selectedStack: number | null
  handleSelectStack: (stackId: number) => void
  availableBots: BotInfo[]
  availableStacks: Stack[]
  isStackAgentsOpen: boolean
  setIsStackAgentsOpen: (open: boolean) => void
}

export function SearchPanel({
  isSearchOpen,
  setIsSearchOpen,
  searchTerm,
  setSearchTerm,
  searchType,
  setSearchType,
  filteredItems,
  selectedBot,
  handleSelectBot,
  selectedStack,
  handleSelectStack,
  availableBots,
  availableStacks,
  isStackAgentsOpen,
  setIsStackAgentsOpen
}: SearchPanelProps) {
  return (
    <Collapsible open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <Card>
        <CardHeader className="p-4">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex justify-between p-0 text-gray-800 dark:text-gray-100"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <CardTitle className="text-lg font-semibold">Search</CardTitle>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <Tabs
              defaultValue="bot"
              onValueChange={(value) => setSearchType(value as "bot" | "stack")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bot">Bots</TabsTrigger>
                <TabsTrigger value="stack">Stacks</TabsTrigger>
              </TabsList>

              {/* Bots Tab */}
              <TabsContent value="bot">
                <Input
                  placeholder="Search bots by ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ScrollArea className="h-[500px] mt-4 border rounded p-2">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((bot) => {
                      const b = bot as BotInfo
                      return (
                        <div
                          key={b.id}
                          className={`mb-4 last:mb-0 p-2 border rounded cursor-pointer transition-colors h-[120px] overflow-y-hidden ${
                            selectedBot?.id === b.id
                              ? "bg-blue-50 dark:bg-blue-800 border-blue-500"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                          onClick={() => handleSelectBot(b.id)}
                        >
                          <h3 className="font-bold text-gray-800 dark:text-gray-100">
                            {b.name} (ID: {b.id})
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {b.description}
                          </p>
                          <p className="text-sm mt-1 text-gray-700 dark:text-gray-200">
                            <strong>System Prompt:</strong> {b.default_system_prompt}
                          </p>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-gray-500">
                      No bots found. Try a different search term.
                    </p>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Stacks Tab */}
              <TabsContent value="stack">
                <Input
                  placeholder="Search stacks by ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ScrollArea className="h-[300px] mt-4 border rounded p-2">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((stack) => {
                      const s = stack as Stack
                      return (
                        <div
                          key={s.id}
                          className={`mb-4 p-2 border rounded cursor-pointer transition-colors ${
                            selectedStack === s.id
                              ? "bg-blue-50 dark:bg-blue-800 border-blue-500"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                          onClick={() => handleSelectStack(s.id)}
                        >
                          <h3 className="font-bold text-gray-800 dark:text-gray-100">
                            {s.name} (ID: {s.id})
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {s.description}
                          </p>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-gray-500">
                      No stacks found. Try a different search term.
                    </p>
                  )}
                </ScrollArea>

                {/* Stack Agents Collapsible */}
                {searchType === "stack" && selectedStack && (
                  <Collapsible
                    open={isStackAgentsOpen}
                    onOpenChange={setIsStackAgentsOpen}
                    className="mt-4"
                  >
                    <Card className="bg-purple-50/50 dark:bg-purple-900/30">
                      <CardHeader className="p-4">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full flex justify-between p-0 text-gray-800 dark:text-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              <CardTitle className="text-lg font-semibold">
                                Stack Agents
                              </CardTitle>
                            </div>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent>
                          <ScrollArea className="h-full w-full rounded-md border p-4 dark:border-gray-700">
                            {/* Orchestrator Bot */}
                            {availableBots
                              .filter((bot) => {
                                const currentStack = availableStacks.find(
                                  (s) => s.id === selectedStack
                                )
                                return currentStack?.orchestrator_bot_id === bot.id
                              })
                              .map((bot) => (
                                <div
                                  key={bot.id}
                                  className={`mb-2 last:mb-0 p-2 rounded cursor-pointer transition-colors  ${
                                    selectedBot?.id === bot.id
                                      ? "bg-purple-100 dark:bg-purple-800"
                                      : "hover:bg-blue-100 dark:hover:bg-blue-800"
                                  }`}
                                  onClick={() => {
                                    handleSelectBot(bot.id)
                                  }}
                                >
                                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    {bot.name}{" "}
                                    <span className="text-xs text-blue-600 dark:text-blue-300">
                                      (Orchestrator)
                                    </span>
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {bot.description}
                                  </p>
                                </div>
                              ))}

                            {/* Other Agents */}
                            {availableBots
                              .filter((bot) => {
                                const currentStack = availableStacks.find(
                                  (s) => s.id === selectedStack
                                )
                                return (
                                  currentStack?.agents?.includes(bot.id) &&
                                  currentStack?.orchestrator_bot_id !== bot.id
                                )
                              })
                              .map((bot) => (
                                <div
                                  key={bot.id}
                                  className={`mb-2 last:mb-0 p-2 rounded cursor-pointer transition-colors ${
                                    selectedBot?.id === bot.id
                                      ? "bg-purple-100 dark:bg-purple-800"
                                      : "hover:bg-blue-100 dark:hover:bg-blue-800"
                                  }`}
                                  onClick={() => {
                                    handleSelectBot(bot.id)
                                  }}
                                >
                                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    {bot.name}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {bot.description}
                                  </p>
                                </div>
                              ))}

                            {!availableBots.some((bot) =>
                              availableStacks
                                .find((s) => s.id === selectedStack)
                                ?.agents?.includes(bot.id)
                            ) && (
                              <p className="text-sm text-gray-500">
                                No agents found for this stack.
                              </p>
                            )}
                          </ScrollArea>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
