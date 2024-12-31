import { StateGraph } from "@langchain/langgraph";
import { solanaAgentState } from "../../frontend/src/agent/utils/state";
import { generalistNode } from "../../frontend/src/agent/agents/generalAgent";
import { transferSwapNode } from "../../frontend/src/agent/agents/transferOrSwap";
import { managerNode } from "../../frontend/src/agent/agents/manager";
import { readNode } from "../../frontend/src/agent/agents/readAgent";
import { START, END } from "@langchain/langgraph";
import { managerRouter } from "../../frontend/src/agent/utils/route";
import { HumanMessage } from "@langchain/core/messages";

const workflow = new StateGraph(solanaAgentState)
  .addNode("generalist", generalistNode)
  .addNode("manager", managerNode)
  .addNode("transferSwap", transferSwapNode)
  .addNode("read", readNode)
  .addEdge(START, "manager")
  .addConditionalEdges("manager", managerRouter)
  .addEdge("generalist", END)
  .addEdge("transferSwap", END)
  .addEdge("read", END);

export const graph = workflow.compile();

const result = await graph.invoke({
  messages: [new HumanMessage("what is the price of SOL")],
});

console.log(result);
