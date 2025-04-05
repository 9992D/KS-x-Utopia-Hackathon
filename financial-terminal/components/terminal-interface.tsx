"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Terminal } from "lucide-react"

export default function TerminalInterface() {
  const [output, setOutput] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runCommand = async () => {
    setLoading(true)
    setError(null)
    setOutput(null)
  
    try {
      const response = await fetch("http://127.0.0.1:8000/run?ticker=AAPL,NVDA&initial_cash=1000", {
        method: "POST",
      })
  
      console.log("Response status:", response.status)
  
      const text = await response.text()
      console.log("Raw response text:", text)
  
      let data
      try {
        data = JSON.parse(text)
        console.log("Parsed JSON data:", data)
      } catch (jsonError) {
        throw new Error("Invalid JSON received from server.")
      }
  
      if (data.returncode !== 0 || data.stderr) {
        setError(data.stderr || "The command failed with a non-zero exit code.")
      } else {
        setOutput(data.stdout || "No output received.")
      }
  
    } catch (err: any) {
      setError(`Load failed: ${err.message}`)
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }
  

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <header className="border-b border-green-700 pb-4">
        <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
          <Terminal className="h-6 w-6" />
          Financial Analysis Terminal
        </h1>
      </header>

      <div className="flex justify-center my-6">
        <Button
          onClick={runCommand}
          disabled={loading}
          className="bg-green-700 hover:bg-green-600 text-white font-mono px-8 py-6 text-lg"
        >
          {loading ? "Processing..." : "Run Command"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 p-4 rounded font-mono text-red-400 whitespace-pre-wrap">
          <h2 className="text-lg font-bold mb-2">Error</h2>
          {error}
        </div>
      )}

      {output && (
        <div className="border border-green-700 rounded bg-black">
          <div className="bg-green-900/30 p-2 border-b border-green-700">
            <h2 className="font-mono font-bold">Analysis Results</h2>
          </div>
          <pre className="font-mono text-sm p-4 overflow-auto max-h-[70vh] whitespace-pre-wrap">{output}</pre>
        </div>
      )}

      <div className="text-xs text-green-700 mt-4 font-mono">
        Command: curl -X POST "http://127.0.0.1:8000/run?ticker=AAPL,NVDA&initial_cash=1000"
      </div>
    </div>
  )
}
