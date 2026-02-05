from chat_client import execute_chat
from utils import retry

CONFIG = {
    "toolIds": ["plugin-1745475776", "plugin-1763625419"],
    "endpointId": "predefined-openai-gpt4.1",
    "reasoningMode": "grok-4-fast",
    "fulfillmentPrompt": "Return only the URL",
}

@retry()
async def run(user_query: str):
    return await execute_chat(user_query, CONFIG)
