from chat_client import execute_chat
from utils import retry

CONFIG = {
    "toolIds": ["plugin-1748003575"],
    "endpointId": "predefined-openai-gpt4.1",
    "reasoningMode": "gemini-3",
    "fulfillmentPrompt": "",
}

@retry()
async def run(user_query: str):
    return await execute_chat(user_query, CONFIG)
