from chat_client import execute_chat
from utils import retry

CONFIG = {
    "toolIds": ["plugin-1762176202", "plugin-1763625419"],
    "endpointId": "predefined-openai-gpt4.1",
    "reasoningMode": "gemini-3",
    "fulfillmentPrompt": "Include only the pdf URL (short.io). Do not format as markdown. Keep plain text.",
}

@retry()
async def run(user_query: str):
    return await execute_chat(user_query, CONFIG)
