from fastapi import FastAPI, Query
from subprocess import Popen, PIPE

app = FastAPI()

@app.post("/run")
def run_script(
    ticker: str = Query(...),
    initial_cash: float = Query(...)
):
    print(f"Requête reçue avec ticker={ticker}, initial_cash={initial_cash}")

    command = [
        "poetry", "run", "python", "src/main.py",
        "--ticker", ticker,
        "--initial-cash", str(initial_cash)
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
