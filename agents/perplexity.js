const executeChat = require("../chatClient");

const CONFIG = {
  agentIds: ["agent-1722260873"],
  endpointId: "predefined-openai-gpt4.1",
  reasoningMode: "grok-4-fast",
  fulfillmentPrompt:
    "Create a report with a summary at the top, and multiple sections and headers based on the information received",
};

module.exports = async (userQuery) => {
  return await executeChat(userQuery, CONFIG);
};
