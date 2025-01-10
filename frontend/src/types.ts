export interface Message {
    timestamp: any
    images: boolean
    role: string
    content: string
  }
  
  export interface Dataset {
    title: string
    description: string
    messages: Message[]
  }
  
  export interface ContextWindowData {
    system_prompt: string
    datasets: Dataset[]
    memories: Dataset[]
    messages: Message[]
  }
  
  export interface BotInfo {
    name: string
    id: number
    description: string
    default_system_prompt: string
    system_prompt: string
    model: string
  }
  
  export interface Stack {
    default_system_prompt: string
    name: string
    id: number
    description: string
    agents: number[]
    orchestrator_bot_id: number
  }
  
  export interface Checkpoint {
    id: number
    bot_id: number
    checkpoint_number: number
    version: string
    created_at: string
    model: string
    system_prompt: string
    datasets: string
    memories: string
    session_history: string
  }
  
  export interface Session {
    id: number
    bot_id: number
    started_at: string
    ended_at: string | null
    messages: string
  }
  