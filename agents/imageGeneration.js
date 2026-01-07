const executeChat = require("../chatClient");

const CONFIG = {
  agentIds: ["agent-1745475776", "agent-1763625419"],
  endpointId: "predefined-openai-gpt4.1",
  reasoningMode: "grok-4-fast",
  fulfillmentPrompt: "Return only the URL",
};

module.exports = async (userQuery) => {
  return await executeChat(userQuery, CONFIG);
};
