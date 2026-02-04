const executeChat = require("../chatClient");

const CONFIG = {
  toolIds: ["plugin-1762176202", "plugin-1763625419"],
  endpointId: "predefined-openai-gpt4.1",
  reasoningMode: "gemini-3",
  fulfillmentPrompt:
    "Include only the pdf URL (short.io). Do not format as markdown. Keep plain text.",
};

module.exports = async (userQuery) => {
  return await executeChat(userQuery, CONFIG);
};