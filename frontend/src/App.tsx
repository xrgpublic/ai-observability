"use client"

import * as React from "react"
import classNames from "classnames"
import {
  Flag,
  History,
  ListChecks,
  Moon,
  Sun,
  Code,
} from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// -- Import our new components --
import { CheckpointsDrawer } from "@/components/CheckpointsDrawer"
import { SearchPanel } from "@/components/SearchPanel"
import { OverviewTab } from "@/components/OverviewTab"
import { ContextTab } from "@/components/ContextTab"
import { PythonIDE } from "@/components/PythonIDE"
import { ConversationPanel } from "@/components/ConversationPanel"
import { SessionTab } from "./components/SessionTab"

// -- Import shared types --
import { BotInfo, Message, ContextWindowData, Checkpoint, Stack, Session } from "@/types"

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
    try{
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
    } catch (e) {
      console.error("Checkpoint selection error:", e)
    }
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
      } else {
        setContextWindowData({
          system_prompt: "You are a helpful assistant.",
          datasets: [],
          memories: [],
          messages: []
        });
      }

      // const sessionHistoryResponse = await fetch(`${WORKSPACE_URL}/bots/${botData.id}/sessions/current`);
      // if (sessionHistoryResponse.ok) {
      //   const sessionData = await sessionHistoryResponse.json();
      //   setSessionHistory(sessionData);
      // } else {
      //   setSessionHistory([]);
      // }

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

        {/* -------- Right Column: Tabs (Overview, Context, Session, Python IDE, Conversation) -------- */}
        <div className="md:col-span-9 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-5 w-full mb-4">
              <TabsTrigger value="overview">
                <Flag className="h-4 w-4 mr-1" /> Overview
              </TabsTrigger>
              <TabsTrigger value="context">
                <Flag className="h-4 w-4 mr-1" /> Context
              </TabsTrigger>
              <TabsTrigger value="session">
                <History className="h-4 w-4 mr-1" /> Session
              </TabsTrigger>
              <TabsTrigger value="python-ide">
                <Code className="h-4 w-4 mr-1" /> Python IDE
              </TabsTrigger>
              <TabsTrigger value="conversation">
                <History className="h-4 w-4 mr-1" /> Conversation
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

            {/* TODO */}
            {/* ------- Session (similar extraction) -------
            <TabsContent value="session">
              <SessionTab
                selectedBot={selectedBot}
                selectedCheckpoint={selectedCheckpoint}
                messages={contextWindowData.messages} 
                onStartSession={async () => {
                  if (!selectedBot?.id) return;
                  try {
                    const response = await fetch(`${WORKSPACE_URL}/sessions/bot/${selectedBot.id}/start`, {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                      }
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to start session');
                    }
                    
                    console.log('Session started successfully');
                  } catch (error) {
                    console.error('Error starting session:', error);
                  }
                }}
                onEndSession={async () => {
                  if (!selectedBot?.id) return;
                  try {
                    const response = await fetch(`${WORKSPACE_URL}/sessions/bot/${selectedBot.id}/end`, {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                      }
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to end session');
                    }
                    
                    // Clear the messages in the UI
                    setContextWindowData(prev => ({
                      ...prev,
                      messages: []
                    }));
                    
                    console.log('Session ended successfully');
                  } catch (error) {
                    console.error('Error ending session:', error);
                  }
                }}
                onSendMessage={async (content: string) => {
                  if (!selectedBot?.id) return;

                  try {
                    // Add user message to UI immediately
                    setContextWindowData(prev => ({
                      ...prev,
                      messages: [...prev.messages, { role: "user", content, timestamp: new Date().toISOString(), images: false }]
                    }));

                    // Send message to backend
                    const response = await fetch(`${WORKSPACE_URL}/sessions/bot/${selectedBot.id}/message`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        role: 'user',
                        content
                      })
                    });

                    const responseText = await response.text();
                    
                    if (!response.ok) {
                      throw new Error(responseText || 'Failed to send message');
                    }

                    try {
                      // Parse the response text as JSON
                      const data = JSON.parse(responseText);
                      // Update messages with the full conversation including bot's response
                      setContextWindowData(prev => ({
                        ...prev,
                        messages: data
                      }));
                    } catch (parseError) {
                      console.error('Error parsing response:', responseText);
                      throw new Error('Invalid response format from server');
                    }
                  } catch (error) {
                    console.error('Error sending message:', error);
                    // TODO: Add error toast notification
                    // Optionally remove the optimistically added message
                    setContextWindowData(prev => ({
                      ...prev,
                      messages: prev.messages.slice(0, -1) // Remove last message
                    }));
                  }
                }}
              />            
            </TabsContent> */}

            {/* ------- Python IDE ------- */}
            <TabsContent value="python-ide">
              <PythonIDE />
            </TabsContent>
            
            {/* TODO */}
            {/* ------- Conversation -------
            <TabsContent value="conversation">
              <ConversationPanel 
                onExecuteAction={(action) => {
                  // Handle webpage modifications here
                  console.log('Executing action:', action);
                }}
              />
            </TabsContent> */}
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}
