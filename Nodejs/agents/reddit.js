const executeChat = require("../chatClient");

const CONFIG = {
  toolIds: ["plugin-1748003575"],
  endpointId: "predefined-openai-gpt4.1",
  reasoningMode: "gemini-3",
  fulfillmentPrompt: "",
};

module.exports = async (userQuery) => {
  return await executeChat(userQuery, CONFIG);
};
