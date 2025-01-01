"use client"

import * as React from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Maximize2, Play, Loader2, Terminal } from "lucide-react"
import axios from "axios"
import AnsiToHtml from 'ansi-to-html'

const WORKSPACE_URL = "http://127.0.0.1:5000/api/v1"
const ansiConverter = new AnsiToHtml()

// Basic templates
const DEFAULT_TEMPLATES = {
  "blank": "# Write your Python code here\nprint('Hello, World!')",
}

const EditorComponent = React.memo(({ 
  height = "400px", 
  value, 
  onChange 
}: { 
  height?: string, 
  value: string,
  onChange: (value: string | undefined) => void
}) => (
  <Editor
    height={height}
    defaultLanguage="python"
    theme="vs-dark"
    value={value}
    onChange={onChange}
    options={{
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: "on",
      automaticLayout: true,
    }}
  />
))

EditorComponent.displayName = 'EditorComponent'

export function PythonIDE() {
  const [code, setCode] = React.useState(DEFAULT_TEMPLATES.blank)
  const [output, setOutput] = React.useState("")
  const [isRunning, setIsRunning] = React.useState(false)
  const [selectedTemplate, setSelectedTemplate] = React.useState("blank")
  const [scriptTemplates, setScriptTemplates] = React.useState<Record<string, { name: string; code: string }>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [showOutput, setShowOutput] = React.useState(true)

  const handleCodeChange = React.useCallback((value: string | undefined) => {
    setCode(value || "")
  }, [])

  // Fetch script templates on component mount
  React.useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await axios.get(`${WORKSPACE_URL}/python-ide/get-scripts`)
        console.log('Fetched scripts:', response.data)
        setScriptTemplates(response.data)
      } catch (error) {
        console.error('Error fetching scripts:', error)
        if (axios.isAxiosError(error)) {
          console.error('Axios error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          })
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchScripts()
  }, [])

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value)
    if (value in DEFAULT_TEMPLATES) {
      setCode(DEFAULT_TEMPLATES[value as keyof typeof DEFAULT_TEMPLATES])
    } else {
      setCode(scriptTemplates[value]?.code || '')
    }
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setShowOutput(true) // Show output when running code
    try {
      const response = await axios.post(`${WORKSPACE_URL}/python-ide/run-python`, {
        code: code
      })
      
      let outputText = response.data.output || ""
      const errorText = response.data.error || ""
      
      if (errorText) {
        outputText += "\n" + errorText
      }
      
      // Convert ANSI codes to HTML
      if (response.data.hasAnsiCodes) {
        const htmlOutput = ansiConverter.toHtml(outputText)
        setOutput(htmlOutput)
      } else {
        setOutput(outputText)
      }
    } catch (error: any) {
      setOutput("Error running code: " + (error.response?.data?.error || error.message))
    }
    setIsRunning(false)
  }

  const OutputToggleButton = () => (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8"
      onClick={() => setShowOutput(!showOutput)}
      title={showOutput ? "Hide Terminal" : "Show Terminal"}
    >
      <Terminal className={`h-4 w-4 ${showOutput ? 'text-green-500' : 'text-gray-500'}`} />
    </Button>
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="p-4 relative">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold ">Code Editor</h3>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={isLoading ? "Loading templates..." : "Select template"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank Template</SelectItem>
                {Object.entries(scriptTemplates).map(([filename, { name }]) => (
                  <SelectItem key={filename} value={filename}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Code
                </>
              )}
            </Button>
            <OutputToggleButton />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-2 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <DialogTitle>Code Editor</DialogTitle>
                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={isLoading ? "Loading templates..." : "Select template"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blank">Blank Template</SelectItem>
                        {Object.entries(scriptTemplates).map(([filename, { name }]) => (
                          <SelectItem key={filename} value={filename}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="flex items-center gap-2"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Run Code
                        </>
                      )}
                    </Button>
                    <OutputToggleButton />
                  </div>
                </DialogHeader>
                <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                  <div className={`${!showOutput ? 'flex-1' : 'h-[60%]'} min-h-0`}>
                    <EditorComponent 
                      height="100%" 
                      value={code}
                      onChange={handleCodeChange}
                    />
                  </div>
                  {showOutput && (
                    <div className="h-[40%] min-h-[200px] flex flex-col overflow-hidden">
                      <div className="flex justify-between items-center mb-2 flex-shrink-0">
                        <h3 className="text-lg font-semibold">Output:</h3>
                      </div>
                      <div className="flex-1 overflow-auto bg-slate-950 text-slate-50 p-4 rounded-md">
                        <pre 
                          className="h-full"
                          dangerouslySetInnerHTML={{ __html: output }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <EditorComponent 
          height="600px"
          value={code}
          onChange={handleCodeChange}
        />
      </Card>
      
      {showOutput && (
        <Card className="p-4 max-h-[400px] overflow-y-auto relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Output:</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Output</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto bg-slate-950 text-slate-50 p-4 rounded-md">
                  <pre 
                    className="h-full"
                    dangerouslySetInnerHTML={{ __html: output }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-1 overflow-auto bg-slate-950 text-slate-50 p-4 rounded-md">
            <pre 
              className="h-full"
              dangerouslySetInnerHTML={{ __html: output }}
            />
          </div>
        </Card>
      )}
    </div>
  )
}