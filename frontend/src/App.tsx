"use client"

import * as React from "react"
import classNames from "classnames"
import {
  Flag,
  History,
  ListChecks,
  Moon,
  Sun,
} from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// -- Import our new components --
import { CheckpointsDrawer } from "@/components/CheckpointsDrawer"
import { SearchPanel } from "@/components/SearchPanel"
import { OverviewTab } from "@/components/OverviewTab"
import { ContextTab } from "@/components/ContextTab"

// -- Import shared types --
import { BotInfo, Message, ContextWindowData, Checkpoint, Stack, Session } from "@/types"
import { SessionTab } from "./components/SessionTab"

// You can keep your utility functions and hooks within the same file, or create separate hooks:
const WORKSPACE_URL = "http://127.0.0.1:5000/api/v1"

export default function App() {
  // --- Collapsible and Drawer State ---
  const [isSearchOpen, setIsSearchOpen] = React.useState(true)
  const [isStackAgentsOpen, setIsStackAgentsOpen] = React.useState(true)
  const [isCheckpointsDrawerOpen, setIsCheckpointsDrawerOpen] = React.useState(false)

  // --- Data States ---
  const [contextWindowData, setContextWindowData] = React.useState<ContextWindowData>({
    system_prompt: "You are a helpful assistant.",
    datasets: [],
    memories: [],
    messages: []
  })
  const [botInfo, setBotInfo] = React.useState<BotInfo>({
    name: "",
    id: 0,
    description: "",
    default_system_prompt: "",
    system_prompt: "",
    model: ""
  })
  const [checkpoints, setCheckpoints] = React.useState<Checkpoint[]>([])
  const [availableBots, setAvailableBots] = React.useState<BotInfo[]>([])
  const [availableStacks, setAvailableStacks] = React.useState<Stack[]>([])
  const [, setSessionHistory] = React.useState<Message[]>([])
  const [, setCurrentSession] = React.useState<Session | null>(null)
  
  // --- Selection States ---
  const [selectedBot, setSelectedBot] = React.useState<BotInfo | null>(null)
  const [selectedStack, setSelectedStack] = React.useState<number | null>(null)
  const [selectedCheckpoint, setSelectedCheckpoint] = React.useState<number | null>(null)

  // --- Misc UI/UX States ---
  const [editMode, setEditMode] = React.useState({
    botInfo: false,
    context: false,
    checkpoints: false
  })
  const [darkMode, setDarkMode] = React.useState(false)
  const [showChainOfThought, setShowChainOfThought] = React.useState(false)
  const [contextSummary] = React.useState<string | null>(null)

  // --- Chat/Session States ---
  const [isChatActive] = React.useState(false)
  const [currentMessage, setCurrentMessage] = React.useState("")

  // --- Search States ---
  const [searchTerm, setSearchTerm] = React.useState("")
  const [searchType, setSearchType] = React.useState<"bot" | "stack">("bot")

  // --- System Prompt Preview toggles ---
  const [showFullText_default, setShowFullText_default] = React.useState(false)
  const [showFullText_current, setShowFullText_current] = React.useState(false)
  const fullText_default = botInfo.default_system_prompt || "N/A"
  const fullText_current = botInfo.system_prompt || "N/A"
  const previewText_default =
    fullText_default.split(" ").slice(0, 150).join(" ") +
    (fullText_default.split(" ").length > 150 ? "..." : "")
  const previewText_current =
    fullText_current.split(" ").slice(0, 150).join(" ") +
    (fullText_current.split(" ").length > 150 ? "..." : "")

  // --- Lifecycle: Fetch bots & stacks once ---
  React.useEffect(() => {
    const fetchBots = async () => {
      try {
        const response = await fetch(`${WORKSPACE_URL}/bots`)
        if (!response.ok) {
          throw new Error(`Failed to fetch bots: ${response.status}`)
        }
        const data = await response.json()
        setAvailableBots(data)
      } catch (e) {
        console.error(e)
      }
    }

    const fetchStacks = async () => {
      try {
        const response = await fetch(`${WORKSPACE_URL}/stacks`)
        if (!response.ok) {
          throw new Error(`Failed to fetch stacks: ${response.status}`)
        }
        const data = await response.json()
        setAvailableStacks(data)
      } catch (e) {
        console.error(e)
      }
    }

    fetchBots()
    fetchStacks()
  }, [])

  // --- Searching & Filtering ---
  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }
  const startNewSession = async (botId: number) => {
    try {
      const response = await fetch(`${WORKSPACE_URL}/bots/${botId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start new session: ${response.status} ${errorText}`);
      }
      
      const session = await response.json();
      setCurrentSession(session);
      return session;
    } catch (error) {
      console.error('Error starting new session:', error);
      throw error;
    }
  };

  const filteredItems = React.useMemo(() => {
    if (searchType === "bot") {
      return availableBots.filter(
        (bot) =>
          bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bot.id.toString().includes(searchTerm)
      )
    } else {
      return availableStacks.filter(
        (stack) =>
          stack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stack.id.toString().includes(searchTerm)
      )
    }
  }, [searchTerm, searchType, availableBots, availableStacks])

  // --- Edit/Save Handlers ---
  const handleEdit = (section: keyof typeof editMode) => {
    setEditMode((prev) => ({ ...prev, [section]: true }))
  }
  const handleSave = (section: keyof typeof editMode) => {
    setEditMode((prev) => ({ ...prev, [section]: false }))
    // Place your saving logic here
  }

  // --- Checkpoint Handlers ---
  const handleSelectCheckpoint = (checkpointId: number) => {
    // Your existing logic...
    const newSelectedCheckpoint = checkpointId === selectedCheckpoint ? null : checkpointId;
    setSelectedCheckpoint(newSelectedCheckpoint);

    if (newSelectedCheckpoint && checkpoints.length > 0) {
      const cp = checkpoints.find(c => c.id === newSelectedCheckpoint);
      setBotInfo(prev => ({ ...prev, system_prompt: cp?.system_prompt || "", model: cp?.model || "" }));

      if (cp) {
        setContextWindowData({
          system_prompt: cp.system_prompt,
          datasets: cp.datasets ? JSON.parse(cp.datasets) : [],
          memories: cp.memories ? JSON.parse(cp.memories) : [],
          messages: cp.session_history ? JSON.parse(cp.session_history) : []
        });
      }
    } else {
      setContextWindowData({
        system_prompt: "You are a helpful assistant.",
        datasets: [],
        memories: [],
        messages: []
      });
    }
    // simplified for brevity
    setSelectedCheckpoint(checkpointId)
  }
  const handleDeleteCheckpoint = async () => {
    // ...
  }

  // --- Bot & Stack Selections ---
  const handleSelectBot = async (botId: number) => {
    // Your existing logic to fetch Bot info, Checkpoints, etc...
    const newSelectedBot = availableBots.find(bot => bot.id === botId) || null;
    setSelectedBot(newSelectedBot);

    if (!newSelectedBot) {
      setBotInfo({ name: "", id: 0, description: "", default_system_prompt: "", system_prompt: "", model: "" });
      setCheckpoints([]);
      setSelectedCheckpoint(null);
      setContextWindowData({
        system_prompt: "You are a helpful assistant.",
        datasets: [],
        memories: [],
        messages: []
      });
      setSessionHistory([]);
      return;
    }

    try {
      const botResponse = await fetch(`${WORKSPACE_URL}/bots/${newSelectedBot.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!botResponse.ok) {
        throw new Error(`Failed to fetch bot info: ${botResponse.status}`);
      }
      const botData = await botResponse.json();
      setBotInfo(botData);

      const checkpointsResponse = await fetch(`${WORKSPACE_URL}/bots/${botData.id}/checkpoints`);
      if (!checkpointsResponse.ok) {
        throw new Error(`Failed to fetch checkpoints: ${checkpointsResponse.status}`);
      }
      const checkpointsData = await checkpointsResponse.json();
      setCheckpoints(checkpointsData);

      if (checkpointsData.length > 0) {
        const firstCheckpoint: Checkpoint = checkpointsData[0];
        setSelectedCheckpoint(firstCheckpoint.checkpoint_number);
        setContextWindowData({
          system_prompt: firstCheckpoint.system_prompt,
          datasets: firstCheckpoint.datasets ? JSON.parse(firstCheckpoint.datasets) : [],
          memories: firstCheckpoint.memories ? JSON.parse(firstCheckpoint.memories) : [],
          messages: firstCheckpoint.session_history ? JSON.parse(firstCheckpoint.session_history) : []
        });
        await startNewSession(botData.id);
      } else {
        setContextWindowData({
          system_prompt: "You are a helpful assistant.",
          datasets: [],
          memories: [],
          messages: []
        });
        await startNewSession(botData.id);
      }

      const sessionHistoryResponse = await fetch(`${WORKSPACE_URL}/bots/${botData.id}/sessions/current`);
      if (sessionHistoryResponse.ok) {
        const sessionData = await sessionHistoryResponse.json();
        setSessionHistory(sessionData);
      } else {
        setSessionHistory([]);
      }

    } catch (e) {
      console.error(e);
    }
  }
  const handleSelectStack = (stackId: number) => {
    setSelectedStack(stackId === selectedStack ? null : stackId)
  }

  // --- Session Handlers (start, end, sendMessage, etc) ---
  const handleStartSession = async () => { /* ... */ }
  const handleEndSession = async () => { /* ... */ }
  const handleSendMessage = async () => { /* ... */ }

  // --- Return the main layout ---
  const themeClasses = darkMode
    ? "dark bg-gray-900 text-gray-100"
    : "bg-white text-gray-900"

  return (
    <TooltipProvider>
      <div
        className={classNames(
          "p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto transition-colors",
          themeClasses
        )}
      >
        {/* -------- Checkpoints Drawer -------- */}
        <CheckpointsDrawer
          isCheckpointsDrawerOpen={isCheckpointsDrawerOpen}
          setIsCheckpointsDrawerOpen={setIsCheckpointsDrawerOpen}
          checkpoints={checkpoints}
          selectedCheckpoint={selectedCheckpoint}
          handleSelectCheckpoint={handleSelectCheckpoint}
          handleDeleteCheckpoint={handleDeleteCheckpoint}
          editMode={editMode.checkpoints}
          handleEdit={() => handleEdit("checkpoints")}
          handleSave={() => handleSave("checkpoints")}
        />

        {/* -------- Left Column: Search & Toggle -------- */}
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">AI Observability</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setDarkMode(!darkMode)}
                className="p-1"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCheckpointsDrawerOpen(!isCheckpointsDrawerOpen)}
              >
                <ListChecks className="h-4 w-4 mr-1" /> Checkpoints
              </Button>
            </div>
          </div>

          {/* Search Panel */}
          <SearchPanel
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            searchTerm={searchTerm}
            setSearchTerm={handleSearch}
            searchType={searchType}
            setSearchType={setSearchType}
            filteredItems={filteredItems}
            selectedBot={selectedBot}
            handleSelectBot={handleSelectBot}
            selectedStack={selectedStack}
            handleSelectStack={handleSelectStack}
            availableBots={availableBots}
            availableStacks={availableStacks}
            isStackAgentsOpen={isStackAgentsOpen}
            setIsStackAgentsOpen={setIsStackAgentsOpen}
          />
        </div>

        {/* -------- Right Column: Tabs (Overview, Context, Session) -------- */}
        <div className="md:col-span-9 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="overview">
                <Flag className="h-4 w-4 mr-1" /> Overview
              </TabsTrigger>
              <TabsTrigger value="context">
                <Flag className="h-4 w-4 mr-1" /> Context
              </TabsTrigger>
              <TabsTrigger value="session">
                <History className="h-4 w-4 mr-1" /> Session
              </TabsTrigger>
            </TabsList>

            {/* ------- Overview ------- */}
            <TabsContent value="overview">
              <OverviewTab
                botInfo={botInfo}
                setBotInfo={setBotInfo}
                editMode={editMode.botInfo}
                handleEdit={() => handleEdit("botInfo")}
                handleSave={() => handleSave("botInfo")}
                showFullText_default={showFullText_default}
                setShowFullText_default={setShowFullText_default}
                showFullText_current={showFullText_current}
                setShowFullText_current={setShowFullText_current}
                previewText_default={previewText_default}
                previewText_current={previewText_current}
                fullText_default={fullText_default}
                fullText_current={fullText_current}
              />
            </TabsContent>

            {/* ------- Context ------- */}
            <TabsContent value="context">
              <ContextTab
                contextWindowData={contextWindowData}
                contextSummary={contextSummary}
                showChainOfThought={showChainOfThought}
                setShowChainOfThought={setShowChainOfThought}
                editMode={editMode.context}
                handleEdit={() => handleEdit("context")}
                handleSave={() => handleSave("context")}
              />
            </TabsContent>

            {/* ------- Session (similar extraction) ------- */}
            <TabsContent value="session">
              <SessionTab
                isChatActive={isChatActive}
                contextWindowData={contextWindowData}
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                handleSendMessage={handleSendMessage}
                handleStartSession={handleStartSession}
                handleEndSession={handleEndSession}
              />
              {/* You would similarly create a <SessionTab> component to handle the session/chat UI. */}
              {/* For brevity, let's just inline it here or import from another file */}
              <div className="bg-orange-50/50 dark:bg-orange-900/30 transition-colors p-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Session
                </h2>
                {/* Your session UI goes here */}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}
