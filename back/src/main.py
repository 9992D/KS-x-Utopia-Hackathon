import sys
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langgraph.graph import END, StateGraph
from colorama import Fore, Style, init
from agents.ben_graham import ben_graham_agent
from agents.bill_ackman import bill_ackman_agent
from agents.portfolio_manager import portfolio_management_agent
from agents.risk_manager import risk_management_agent
from agents.warren_buffett import warren_buffett_agent
from graph.state import AgentState
from utils.display import print_trading_output
from utils.analysts import get_analyst_nodes
from utils.progress import progress

import argparse
from datetime import datetime
from dateutil.relativedelta import relativedelta
from utils.visualize import save_graph_as_png
import json

# Load environment variables from .env file
load_dotenv()

init(autoreset=True)

def parse_hedge_fund_response(response):
    try:
        return json.loads(response)
    except Exception as e:
        print(f"Error parsing response: {e}\nResponse: {response}")
        return None

def run_hedge_fund(
    tickers: list[str],
    start_date: str,
    end_date: str,
    portfolio: dict,
    show_reasoning: bool = False,
    selected_analysts: list[str] = [],
    model_name: str = "gpt-4o",
    model_provider: str = "OpenAI",
):
    progress.start()
    try:
        workflow = create_workflow(selected_analysts)
        agent = workflow.compile()

        final_state = agent.invoke({
            "messages": [HumanMessage(content="Make trading decisions based on the provided data.")],
            "data": {"tickers": tickers, "portfolio": portfolio, "start_date": start_date, "end_date": end_date, "analyst_signals": {}},
            "metadata": {"show_reasoning": show_reasoning, "model_name": model_name, "model_provider": model_provider},
        })

        return {
            "decisions": parse_hedge_fund_response(final_state["messages"][-1].content),
            "analyst_signals": final_state["data"]["analyst_signals"],
        }
    finally:
        progress.stop()

def start(state: AgentState):
    return state

def create_workflow(selected_analysts=None):
    workflow = StateGraph(AgentState)
    workflow.add_node("start_node", start)
    analyst_nodes = get_analyst_nodes()

    if selected_analysts is None:
        selected_analysts = list(analyst_nodes.keys())

    for analyst_key in selected_analysts:
        node_name, node_func = analyst_nodes[analyst_key]
        workflow.add_node(node_name, node_func)
        workflow.add_edge("start_node", node_name)

    workflow.add_node("risk_management_agent", risk_management_agent)
    workflow.add_node("portfolio_management_agent", portfolio_management_agent)

    for analyst_key in selected_analysts:
        node_name = analyst_nodes[analyst_key][0]
        workflow.add_edge(node_name, "risk_management_agent")

    workflow.add_edge("risk_management_agent", "portfolio_management_agent")
    workflow.add_edge("portfolio_management_agent", END)

    workflow.set_entry_point("start_node")
    return workflow

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the hedge fund trading system")
    parser.add_argument("--initial-cash", type=float, default=100000.0)
    parser.add_argument("--margin-requirement", type=float, default=0.0)
    parser.add_argument("--tickers", type=str, required=True)
    parser.add_argument("--start-date", type=str)
    parser.add_argument("--end-date", type=str)
    parser.add_argument("--show-reasoning", action="store_true")

    args = parser.parse_args()
    tickers = [ticker.strip() for ticker in args.tickers.split(",")]

    selected_analysts = ["ben_graham", "bill_ackman", "warren_buffett"]
    model_name = "mistral-medium"
    model_provider = "Mistral"

    end_date = args.end_date or datetime.now().strftime("%Y-%m-%d")
    if not args.start_date:
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
        start_date = (end_date_obj - relativedelta(months=3)).strftime("%Y-%m-%d")
    else:
        start_date = args.start_date

    portfolio = {
        "cash": args.initial_cash,
        "margin_requirement": args.margin_requirement,
        "margin_used": 0.0,
        "positions": {ticker: {"long": 0, "short": 0, "long_cost_basis": 0.0, "short_cost_basis": 0.0, "short_margin_used": 0.0} for ticker in tickers},
        "realized_gains": {ticker: {"long": 0.0, "short": 0.0} for ticker in tickers}
    }

    result = run_hedge_fund(
        tickers=tickers,
        start_date=start_date,
        end_date=end_date,
        portfolio=portfolio,
        show_reasoning=args.show_reasoning,
        selected_analysts=selected_analysts,
        model_name=model_name,
        model_provider=model_provider,
    )

    print_trading_output(result)
