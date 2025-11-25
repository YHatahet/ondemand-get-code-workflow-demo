const executeChat = require("../chatClient");

const CONFIG = {
  agentIds: ["agent-1762176202"],
  endpointId: "predefined-openai-gpt4.1",
  reasoningMode: "flash",
  fulfillmentPrompt:
    "Write a summary of the findings. Include the pdf URL at the bottom of the email. Do not format as markdown. Keep plain text.",
};

module.exports = async (userQuery) => {
  return await executeChat(userQuery, CONFIG);
};