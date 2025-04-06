"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Terminal, X } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const AVAILABLE_TICKERS = ["AAPL", "NVDA", "TSLA", "MSFT", "GOOGL"]

const AVAILABLE_ANALYSTS = [
  "Ben Graham", "Bill Ackman", "Cathie Wood", "Charlie Munger",
  "Peter Lynch", "Phil Fisher", "Stanley Druckenmiller",
  "Warren Buffett", "Technical Analyst", "Fundamentals Analyst", "Sentiment Analyst"
]

const AVAILABLE_MODELS = [
  { display: "[openai] gpt-4o", model: "gpt-4o", provider: "OpenAI" },
  { display: "[openai] gpt-4.5", model: "gpt-4.5-preview", provider: "OpenAI" },
  { display: "[anthropic] claude-3.5-haiku", model: "claude-3-5-haiku-latest", provider: "Anthropic" },
  { display: "[mistralai] mistral-medium", model: "mistral-medium", provider: "Mistral" },
  { display: "[groq] llama-3.3 70b", model: "llama-3.3-70b-versatile", provider: "Groq" },
]

export default function TerminalInterface() {
  const [initialCash, setInitialCash] = useState("1000")
  const [selectedTickers, setSelectedTickers] = useState<string[]>(["AAPL", "NVDA"])
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>(["Ben Graham", "Bill Ackman"])
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0])
  const [output, setOutput] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTickers, setShowTickers] = useState(false)
  const [showAnalysts, setShowAnalysts] = useState(false)

  const toggleItem = (item: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const removeItem = (item: string, list: string[], setList: (val: string[]) => void) => {
    setList(list.filter(i => i !== item))
  }

  const runCommand = async () => {
    if (selectedTickers.length === 0) return setError("Please select at least one ticker.")
    if (selectedAnalysts.length === 0) return setError("Please select at least one analyst.")

    setLoading(true)
    setError(null)
    setOutput(null)

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/run?ticker=${encodeURIComponent(selectedTickers.join(","))}&initial_cash=${encodeURIComponent(initialCash)}&selected_analysts=${encodeURIComponent(selectedAnalysts.map(a => a.toLowerCase().replace(/\s+/g, "_")).join(","))}&model_name=${encodeURIComponent(selectedModel.model)}&model_provider=${encodeURIComponent(selectedModel.provider)}`,
        { method: "POST" }
      )

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error("Invalid JSON received from server.")
      }

      if (data.returncode !== 0 || data.stderr) {
        setError(data.stderr || "The command failed with a non-zero exit code.")
      } else {
        setOutput(data.stdout || "No output received.")
      }
    } catch (err: any) {
      setError(`Load failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const PillSelector = ({ label, list, setList, options, toggle }: any) => (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {list.map((item: string) => (
          <div
            key={item}
            className="flex items-center gap-1 bg-green-800 text-black px-2 py-1 rounded-full text-xs font-mono"
          >
            {item}
            <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem(item, list, setList)} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((option: string) => (
          <label
            key={option}
            className="cursor-pointer text-sm font-mono text-green-500 bg-black border border-green-700 px-2 py-1 rounded hover:bg-green-900"
          >
            <input
              type="checkbox"
              checked={list.includes(option)}
              onChange={() => toggle(option, list, setList)}
              className="mr-2 accent-green-500"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <header className="border-b border-green-700 pb-4">
        <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
          <Terminal className="h-6 w-6" />
          αThesis.ai
        </h1>
      </header>

      <Accordion type="multiple" className="w-full space-y-0">
        <AccordionItem value="cash" className="border-t border-green-700 font-mono">
          <AccordionTrigger>Initial Cash</AccordionTrigger>
          <AccordionContent>
            <input
              type="number"
              value={initialCash}
              onChange={(e) => setInitialCash(e.target.value)}
              placeholder="Initial Cash"
              className="appearance-none px-4 py-3 rounded bg-black border border-green-700 text-green-700 font-mono text-lg w-full"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tickers" className="border-t border-green-700 font-mono">
          <AccordionTrigger>Select Tickers</AccordionTrigger>
          <AccordionContent>
            <PillSelector label="Tickers" list={selectedTickers} setList={setSelectedTickers} options={AVAILABLE_TICKERS} toggle={toggleItem} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="analysts" className="border-t border-green-700 font-mono">
          <AccordionTrigger>Select Analysts</AccordionTrigger>
          <AccordionContent>
            <PillSelector label="Analysts" list={selectedAnalysts} setList={setSelectedAnalysts} options={AVAILABLE_ANALYSTS} toggle={toggleItem} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="model" className="border-t border-green-700 font-mono">
          <AccordionTrigger>Select Model</AccordionTrigger>
          <AccordionContent>
            <select
              value={selectedModel.model}
              onChange={(e) => {
                const found = AVAILABLE_MODELS.find(m => m.model === e.target.value)
                if (found) setSelectedModel(found)
              }}
              className="appearance-none font-mono text-sm bg-black text-green-700 border border-green-700 rounded px-4 py-2 w-full shadow-none outline-none"
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.model} value={m.model}>{m.display}</option>
              ))}
            </select>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-center mt-4">
        <Button
          onClick={runCommand}
          disabled={loading}
          className="bg-green-700 text-white font-mono px-8 py-4 text-lg"
        >
          {loading ? "Processing..." : "Run Analysis"}
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
          <div className="bg-green-900/30 p-2 border-b border-green-700 flex justify-between items-center">
            <h2 className="font-mono font-bold">Analysis Results</h2>

            <Button
              onClick={async () => {
                setLoading(true)
                try {
                  const res = await fetch("/api/pdf", {
                    method: "POST",
                    body: JSON.stringify({ output }),
                    headers: { "Content-Type": "application/json" }
                  })
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = "mistral-report.pdf"
                  a.click()
                  URL.revokeObjectURL(url)
                } catch (err) {
                  console.error("Download error:", err)
                } finally {
                  setLoading(false)
                }
              }}
              className="bg-green-800 text-white font-mono px-4 py-2 text-sm"
              disabled={loading}
            >
              {loading ? "Loading..." : "Download PDF"}
            </Button>

          </div>
          <pre className="font-mono text-sm p-4 overflow-auto max-h-[70vh] whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  )
}
