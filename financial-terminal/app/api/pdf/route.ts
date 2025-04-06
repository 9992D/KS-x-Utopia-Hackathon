import { NextRequest, NextResponse } from "next/server"
import { chromium } from "playwright"

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!

const SYSTEM_PROMPT = `
You are a financial analyst. Reformat the raw input into a clean, structured, and professional HTML investment report.
Use semantic HTML elements like <h1>, <h2>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <ul>, and <p> to organize the content.

Group the analysis by ticker (e.g., AAPL, NVDA, MSFT). For each:
- Add a section titled "Agent Analysis" with a table (Agent, Signal, Confidence, Reasoning).
- Add a section titled "Trading Decision" with Action, Quantity, Confidence, and Reasoning.
- End with a "Portfolio Summary" table and a "Portfolio Strategy" paragraph.

If the input is too long, prioritize the most recent or relevant tickers. Respond with valid HTML only. Do not include CSS or Markdown.
`.trim()

const BACKTEST_PROMPT = `
You are a financial analyst. Reformat the raw backtest logs into a clean and professional HTML investment backtest report.

Highlight the following sections if present:
- A summary of the portfolio (cash, value, return).
- A daily breakdown in table format (Date, Ticker, Action, Quantity, Price, etc.).
- A final "Performance Summary" table with metrics like Sharpe Ratio, Drawdown, Win Rate, etc.

Use semantic HTML (<h1>, <h2>, <table>, etc.) but **do not** include CSS or Markdown. Only return valid HTML.
`.trim()

function splitByTicker(raw: string): string[] {
  const parts = raw.split(/(?=Analysis for [A-Z]{1,5}\n=+)/g)
  const tickerMap = new Map<string, string>()

  for (const part of parts) {
    const match = part.match(/Analysis for ([A-Z]{1,5})/)
    if (match) {
      const ticker = match[1]
      tickerMap.set(ticker, part.trim())
    }
  }

  return Array.from(tickerMap.values())
}

async function callMistral(inputChunk: string, prompt: string): Promise<string> {
  const res = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-medium",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: inputChunk }
      ],
      temperature: 0.7,
      max_tokens: 4096
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Mistral API error (${res.status}): ${err}`)
  }

  const json = await res.json()
  const html = json.choices?.[0]?.message?.content
  if (!html) throw new Error("No content returned from Mistral.")
  return html
}

function extractLastBacktestBlock(output: string): string {
  const summaryBlocks = Array.from(output.matchAll(/PORTFOLIO SUMMARY:[\s\S]+?(?=(\n\s*PORTFOLIO SUMMARY:|PORTFOLIO PERFORMANCE SUMMARY:|$))/g))

  const lastBlock = summaryBlocks.at(-1)?.[0] ?? ""

  const indexOfLast = output.lastIndexOf(lastBlock)
  const afterBlock = output.slice(indexOfLast + lastBlock.length)

  const tableMatch = afterBlock.match(/\+[-+]+\+[\s\S]+?\+[-+]+\+/)
  const tableBlock = tableMatch?.[0] ?? ""

  const perfSummary = output.match(/PORTFOLIO PERFORMANCE SUMMARY:[\s\S]+$/)?.[0] ?? ""

  return [lastBlock.trim(), tableBlock.trim(), perfSummary.trim()].filter(Boolean).join("\n\n")
}


export async function POST(req: NextRequest) {
  try {
    const { output } = await req.json()
    if (!output) return NextResponse.json({ error: "No output provided." }, { status: 400 })

    const isBacktest = output.includes("PORTFOLIO PERFORMANCE SUMMARY") || output.includes("Starting backtest")

    let htmlContent = ""

    if (isBacktest) {
      const lastBlock = extractLastBacktestBlock(output)
      htmlContent = await callMistral(lastBlock, BACKTEST_PROMPT)
    } else {
      const chunks = splitByTicker(output)
      const htmlSections: string[] = []

      for (const chunk of chunks) {
        const section = await callMistral(chunk, SYSTEM_PROMPT)
        htmlSections.push(section + "<div style='page-break-after: always;'></div>")
      }

      htmlContent = htmlSections.join("\n")
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset='UTF-8'>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, sans-serif;
              padding: 60px 40px 100px;
              background: white;
              color: #111;
              position: relative;
            }
            h1 {
              font-size: 32px;
              color: #004400;
              margin-bottom: 10px;
            }
            h2 {
              font-size: 24px;
              color: #006600;
              border-bottom: 1px solid #ccc;
              padding-bottom: 4px;
            }
            h3 {
              font-size: 18px;
              color: #006600;
              margin-top: 1.5em;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
            }
            th {
              background-color: #f5f5f5;
              text-align: left;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 6px 12px;
            }
            ul {
              margin: 0 0 1em 1.5em;
            }
            p {
              margin: 0 0 1em;
            }
            .footer {
              position: fixed;
              bottom: 30px;
              left: 40px;
              right: 40px;
              text-align: center;
              font-size: 12px;
              color: #888;
            }
            .logo {
              width: 120px;
              margin-bottom: 20px;
            }
            .report-container {
              max-width: 800px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>Powered by αThesis.ai</h1>
          </div>
          ${htmlContent}
        </body>
      </html>
    `

    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setContent(fullHtml, { waitUntil: "load" })
    const pdfBuffer = await page.pdf({ format: "A4" })
    await browser.close()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${isBacktest ? "backtest" : "investment"}-report.pdf`
      }
    })
  } catch (err) {
    console.error("❌ Error generating PDF:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
