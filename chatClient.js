const fetch = require("node-fetch");
const { v4: uuidv4 } = require("uuid");
const FormData = require("form-data");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://api.on-demand.io/chat/v1";
const MEDIA_BASE_URL = "https://api.on-demand.io/media/v1";

let EXTERNAL_USER_ID = "<your_external_user_id>";
const RESPONSE_MODE = "sync";
const STOP_SEQUENCES = [];
const TEMPERATURE = 0.7;
const TOP_P = 1;
const MAX_TOKENS = 0;
const PRESENCE_PENALTY = 0;
const FREQUENCY_PENALTY = 0;

// File settings
const FILE_PATH = "<path_to_your_file>";
const FILE_NAME = "<file_name>";
const CREATED_BY = "AIREV";
const UPDATED_BY = "AIREV";
const FILE_AGENTS = [
  "agent-1713954536",
  "agent-1713958591",
  "agent-1713958830",
  "agent-1713961903",
  "agent-1713967141",
];

async function uploadMediaFile(filePath, fileName, agents, sessionId) {
  const url = `${MEDIA_BASE_URL}/public/file/raw`;

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return null;
  }

  console.log(`\n--- Uploading Media File ---`);
  console.log(`📁 File: ${filePath}`);
  console.log(`📝 Name: ${fileName}`);
  console.log(`🔌 Agents: ${JSON.stringify(agents)}`);

  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("sessionId", sessionId);
    formData.append("createdBy", CREATED_BY);
    formData.append("updatedBy", UPDATED_BY);
    formData.append("name", fileName);
    formData.append("responseMode", RESPONSE_MODE);
    agents.forEach((agent) => {
      formData.append("agents", agent);
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { apikey: API_KEY, ...formData.getHeaders() },
      body: formData,
    });

    if (response.status === 201 || response.status === 200) {
      const mediaResponse = await response.json();
      console.log(`✅ Media file uploaded successfully!`);
      console.log(`📄 File ID: ${mediaResponse.data.id}`);
      console.log(`🔗 URL: ${mediaResponse.data.url}`);

      if (mediaResponse.data.context) {
        console.log(
          `📋 Context: ${mediaResponse.data.context.substring(0, 200)}...`
        );
      }

      return mediaResponse.data;
    } else {
      const respBody = await response.text();
      console.log(
        `❌ Error uploading media file: ${response.status} - ${respBody}`
      );
      return null;
    }
  } catch (error) {
    console.log(`❌ Exception during file upload: ${error.message}`);
    return null;
  }
}

async function createChatSession(contextMetadata, config) {
  const url = `${BASE_URL}/sessions`;
  const body = {
    agentIds: config.agentIds, // Use config
    externalUserId: EXTERNAL_USER_ID,
    contextMetadata: contextMetadata,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { apikey: API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.status === 201) {
    const sessionRespData = await response.json();
    return sessionRespData.data.id;
  } else {
    const txt = await response.text();
    console.log(`❌ Error creating session: ${txt}`);
    return "";
  }
}

async function submitQuery(sessionId, contextMetadata, userQuery, config) {
  const url = `${BASE_URL}/sessions/${sessionId}/query`;
  const body = {
    endpointId: config.endpointId,
    query: userQuery,
    agentIds: config.agentIds,
    responseMode: RESPONSE_MODE,
    reasoningMode: config.reasoningMode,
    modelConfigs: {
      fulfillmentPrompt: config.fulfillmentPrompt,
      stopSequences: STOP_SEQUENCES,
      temperature: TEMPERATURE,
      topP: TOP_P,
      maxTokens: MAX_TOKENS,
      presencePenalty: PRESENCE_PENALTY,
      frequencyPenalty: FREQUENCY_PENALTY,
    },
  };

  console.log(`🚀 Submitting query...`);

  const response = await fetch(url, {
    method: "POST",
    headers: { apikey: API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (RESPONSE_MODE === "sync") {
    if (response.status === 200) {
      const original = await response.json();
      if (original.data) original.data.contextMetadata = contextMetadata;
      return original;
    }
    throw new Error(await response.text());
  } else if (RESPONSE_MODE === "stream") {
    console.log("✅ Streaming Response...");
    if (!response.body) return null;

    let fullAnswer = "";
    let finalSessionId = "";
    let finalMessageId = "";
    let metrics = {};

    // Note: ensure your node-fetch version/environment supports getReader, otherwise use .on('data')
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    async function read() {
      const { done, value } = await reader.read();
      if (done) return;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]") return;
          try {
            const event = JSON.parse(dataStr);
            if (event.eventType === "fulfillment") {
              if (event.answer) fullAnswer += event.answer;
              if (event.sessionId) finalSessionId = event.sessionId;
              if (event.messageId) finalMessageId = event.messageId;
            } else if (event.eventType === "metricsLog") {
              if (event.publicMetrics) metrics = event.publicMetrics;
            }
          } catch (e) {
            continue;
          }
        }
      }
      await read();
    }

    await read();

    const finalResponse = {
      message: "Chat query submitted successfully",
      data: {
        sessionId: finalSessionId,
        messageId: finalMessageId,
        answer: fullAnswer,
        metrics: metrics,
        status: "completed",
        contextMetadata: contextMetadata,
      },
    };

    return finalResponse;
  }
}

async function executeChat(userQuery, config) {
  // Validate config
  if (!config || !config.agentIds || !config.endpointId) {
    throw new Error("❌ Missing configuration (agentIds, endpointId, etc)");
  }
  if (API_KEY === "<your_api_key>" || !API_KEY)
    throw new Error("❌ Set API_KEY");

  if (EXTERNAL_USER_ID === "<your_external_user_id>" || !EXTERNAL_USER_ID) {
    EXTERNAL_USER_ID = uuidv4();
  }

  const contextMetadata = [
    { key: "userId", value: "1" },
    { key: "name", value: "John" },
  ];

  const sessionId = await createChatSession(contextMetadata, config);

  if (sessionId) {
    if (
      FILE_PATH !== "<path_to_your_file>" &&
      FILE_PATH &&
      fs.existsSync(FILE_PATH)
    ) {
      await uploadMediaFile(FILE_PATH, FILE_NAME, FILE_AGENTS, sessionId);
    }

    // Pass config to query submission
    const result = await submitQuery(
      sessionId,
      contextMetadata,
      userQuery,
      config
    );
    return result;
  }
  return null;
}

module.exports = executeChat;
