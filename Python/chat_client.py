import json
import os
import uuid
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.getenv("API_KEY")
BASE_URL = "https://api.on-demand.io/chat/v1"
MEDIA_BASE_URL = "https://api.on-demand.io/media/v1"

# Default configuration
EXTERNAL_USER_ID = "<your_external_user_id>"
RESPONSE_MODE = "sync"  # Can be 'sync' or 'stream'
STOP_SEQUENCES = []
TEMPERATURE = 0.7
TOP_P = 1
MAX_TOKENS = 0
PRESENCE_PENALTY = 0
FREQUENCY_PENALTY = 0

# File settings
FILE_PATH = "<path_to_your_file>"
FILE_NAME = "<file_name>"
CREATED_BY = "AIREV"
UPDATED_BY = "AIREV"
FILE_AGENTS = [
    "agent-1713954536",
    "agent-1713958591",
    "agent-1713958830",
    "agent-1713961903",
    "agent-1713967141",
]


async def upload_media_file(
    client: httpx.AsyncClient, file_path, file_name, agents, session_id
):
    """
    Uploads a media file asynchronously.
    """
    url = f"{MEDIA_BASE_URL}/public/file/raw"

    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return None

    print(f"\n--- Uploading Media File ---")
    print(f"📁 File: {file_path}")
    print(f"🔌 Agents: {agents}")

    try:
        # Prepare form data
        # httpx handles data slightly differently than requests for multipart
        data = {
            "sessionId": session_id,
            "createdBy": CREATED_BY,
            "updatedBy": UPDATED_BY,
            "name": file_name,
            "responseMode": RESPONSE_MODE,
        }

        # Add agents (array handling)
        # We manually construct the list of tuples for multi-value keys
        data_payload = list(data.items())
        for agent in agents:
            data_payload.append(("agents", agent))

        headers = {"apikey": API_KEY}

        # Open file in binary mode
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f)}

            response = await client.post(
                url, headers=headers, files=files, data=data_payload
            )

        if response.status_code in [200, 201]:
            media_response = response.json()
            data = media_response.get("data", {})
            print(f"✅ Media file uploaded successfully! ID: {data.get('id')}")
            return data
        else:
            print(
                f"❌ Error uploading media file: {response.status_code} - {response.text}"
            )
            return None

    except Exception as e:
        print(f"❌ Exception during file upload: {str(e)}")
        return None


async def create_chat_session(client: httpx.AsyncClient, context_metadata, config):
    """
    Creates a new chat session asynchronously.
    """
    url = f"{BASE_URL}/sessions"
    agent_ids = config.get("toolIds", [])

    body = {
        "agentIds": agent_ids,
        "externalUserId": EXTERNAL_USER_ID,
        "contextMetadata": context_metadata,
    }

    headers = {"apikey": API_KEY, "Content-Type": "application/json"}

    try:
        response = await client.post(url, json=body, headers=headers)

        if response.status_code == 201:
            session_data = response.json()
            return session_data["data"]["id"]
        else:
            print(f"❌ Error creating session: {response.text}")
            return ""
    except Exception as e:
        print(f"❌ Exception creating session: {e}")
        return ""


async def submit_query(
    client: httpx.AsyncClient, session_id, context_metadata, user_query, config
):
    """
    Submits the query asynchronously. Handles both sync and streaming.
    """
    url = f"{BASE_URL}/sessions/{session_id}/query"

    body = {
        "endpointId": config.get("endpointId"),
        "query": user_query,
        "agentIds": config.get("toolIds", []),
        "responseMode": RESPONSE_MODE,
        "reasoningMode": config.get("reasoningMode"),
        "modelConfigs": {
            "fulfillmentPrompt": config.get("fulfillmentPrompt", ""),
            "stopSequences": STOP_SEQUENCES,
            "temperature": TEMPERATURE,
            "topP": TOP_P,
            "maxTokens": MAX_TOKENS,
            "presencePenalty": PRESENCE_PENALTY,
            "frequencyPenalty": FREQUENCY_PENALTY,
        },
    }

    print(f"🚀 Submitting query...")

    headers = {"apikey": API_KEY, "Content-Type": "application/json"}

    # SYNC MODE
    if RESPONSE_MODE == "sync":
        response = await client.post(url, json=body, headers=headers)
        if response.status_code == 200:
            original = response.json()
            if "data" in original:
                original["data"]["contextMetadata"] = context_metadata
            return original
        else:
            raise Exception(f"Error from API: {response.text}")

    # STREAM MODE
    elif RESPONSE_MODE == "stream":
        print("✅ Streaming Response...")

        full_answer = ""
        final_session_id = ""
        final_message_id = ""
        metrics = {}

        # Use client.stream for streaming responses
        async with client.stream("POST", url, json=body, headers=headers) as response:
            async for line in response.aiter_lines():
                if line:
                    if line.startswith("data:"):
                        data_str = line[5:].strip()  # Remove 'data:'

                        if data_str == "[DONE]":
                            break

                        try:
                            event = json.loads(data_str)
                            if event.get("eventType") == "fulfillment":
                                if "answer" in event:
                                    full_answer += event["answer"]
                                if "sessionId" in event:
                                    final_session_id = event["sessionId"]
                                if "messageId" in event:
                                    final_message_id = event["messageId"]
                            elif event.get("eventType") == "metricsLog":
                                if "publicMetrics" in event:
                                    metrics = event["publicMetrics"]
                        except json.JSONDecodeError:
                            continue

        final_response = {
            "message": "Chat query submitted successfully",
            "data": {
                "sessionId": final_session_id,
                "messageId": final_message_id,
                "answer": full_answer,
                "metrics": metrics,
                "status": "completed",
                "contextMetadata": context_metadata,
            },
        }
        return final_response


# Main exported function
async def execute_chat(user_query, config):
    """
    The main entry point called by the specific agents.
    Uses a single httpx.AsyncClient for efficiency.
    """

    # Validation
    if not config or "toolIds" not in config or "endpointId" not in config:
        raise ValueError("❌ Missing configuration (toolIds, endpointId, etc)")

    if not API_KEY or API_KEY == "<your_api_key>":
        raise ValueError("❌ Set API_KEY in environment variables")

    global EXTERNAL_USER_ID
    if not EXTERNAL_USER_ID or EXTERNAL_USER_ID == "<your_external_user_id>":
        EXTERNAL_USER_ID = str(uuid.uuid4())

    context_metadata = [
        {"key": "userId", "value": "1"},
        {"key": "name", "value": "John"},
    ]

    # Create one client for the lifecycle of this request
    async with httpx.AsyncClient(timeout=60.0) as client:

        # 1. Create Session
        session_id = await create_chat_session(client, context_metadata, config)

        if session_id:
            # 2. Upload File (if path exists and differs from placeholder)
            if (
                FILE_PATH
                and FILE_PATH != "<path_to_your_file>"
                and os.path.exists(FILE_PATH)
            ):

                await upload_media_file(
                    client, FILE_PATH, FILE_NAME, FILE_AGENTS, session_id
                )

            # 3. Submit Query
            result = await submit_query(
                client, session_id, context_metadata, user_query, config
            )
            return result

    return None
