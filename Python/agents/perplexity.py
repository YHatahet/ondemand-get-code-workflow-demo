from chat_client import execute_chat
from utils import retry

CONFIG = {
    "toolIds": ["plugin-1722260873"],
    "endpointId": "predefined-openai-gpt4.1",
    "reasoningMode": "gemini-3",
    "fulfillmentPrompt": "Create a report with a summary at the top, and multiple sections and headers based on the information received",
}

retry()
async def run(user_query: str):
    return await execute_chat(user_query, CONFIG)
