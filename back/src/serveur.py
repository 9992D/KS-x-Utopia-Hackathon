
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from subprocess import Popen, PIPE
import re

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/run")
def run_script(
    ticker: str = Query(..., description="Comma-separated list of tickers"),
    initial_cash: float = Query(...),
    selected_analysts: str = Query("ben_graham,bill_ackman,warren_buffett", description="Comma-separated list of analysts"),
    model_name: str = Query("gpt-4o"),
    model_provider: str = Query("OpenAI")
):
    print(f"Requête reçue avec ticker={ticker}, initial_cash={initial_cash}")
    print(f"Analystes: {selected_analysts}, Model: {model_name}, Provider: {model_provider}")

    command = [
        "poetry", "run", "python", "src/main.py",
        "--ticker", ticker,
        "--initial-cash", str(initial_cash),
        "--analysts", selected_analysts,
        "--model-name", model_name,
        "--model-provider", model_provider
    ]

    print("Commande exécutée:", " ".join(command))

    process = Popen(command, stdout=PIPE, stderr=PIPE, text=True)
    stdout, stderr = process.communicate()

    print("Sortie standard:", stdout)
    print("Sortie erreur:", stderr)

    return {
        "stdout": stdout,
        "stderr": stderr,
        "returncode": process.returncode
    }


@app.post("/backtest")
def run_backtest(
    ticker: str = Query(..., description="Comma-separated list of tickers"),
    start_date: str = Query(...),
    end_date: str = Query(...),
    initial_cash: float = Query(...),
    selected_analysts: str = Query("ben_graham,bill_ackman,warren_buffett"),
    model_name: str = Query("gpt-4o"),
    model_provider: str = Query("OpenAI")
):
    print(f"Requête backtest reçue avec ticker={ticker}, capital={initial_cash}, période={start_date} à {end_date}")
    command = [
        "poetry", "run", "python", "src/backtester.py",
        "--ticker", ticker,
        "--start-date", start_date,
        "--end-date", end_date,
        "--initial-cash", str(initial_cash),
        "--selected-analysts", selected_analysts,
        "--model-name", model_name,
        "--model-provider", model_provider
    ]
    process = Popen(command, stdout=PIPE, stderr=PIPE, text=True)
    stdout, stderr = process.communicate()

    ansi_escape = re.compile(r'\x1B\[[0-?]*[ -/]*[@-~]')
    clean_stdout = ansi_escape.sub('', stdout)

    return {
        "stdout": clean_stdout,
        "stderr": stderr,
        "returncode": process.returncode
    }
