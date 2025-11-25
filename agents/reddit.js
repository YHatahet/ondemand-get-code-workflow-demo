const executeChat = require("../chatClient");

const CONFIG = {
  agentIds: ["agent-1748003575"],
  endpointId: "predefined-openai-gpt4.1",
  reasoningMode: "flash",
  fulfillmentPrompt: "",
};

module.exports = async (userQuery) => {
  return await executeChat(userQuery, CONFIG);
};
