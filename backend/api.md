# GPT Chat Application API Endpoints

## Conversations Management

### Create Conversation
- **Endpoint**: POST /api/conversations
- **Description**: Creates a new conversation
- **Response**: Returns the created conversation ID and initial empty messages array
```json
{
    "id": "string",
    "messages": [],
    "created_at": 1234567890
}
```

### Remove Conversation
- **Endpoint**: DELETE /api/conversations/{id}
- **Description**: Removes a specific conversation by ID
- **Response**: Success status

### List Conversations (History)
- **Endpoint**: GET /api/conversations
- **Description**: Returns a list of all conversations
- **Response**: Array of conversation objects
```json
[
    {
        "id": "string",
        "messages": [
            {
                "role": "user|assistant",
                "content": "string"
            }
        ],
        "created_at": 1234567890
    }
]
```

## Chat Interaction

### Stream Chat Completion
- **Endpoint**: POST /api/conversations/{id}/chat
- **Description**: Sends a message and receives streaming response from OpenAI
- **Request Body**:
```json
{
    "message": "string"
}
```
- **Response**: Server-Sent Events (SSE) stream
- **Stream Format**:
```
data: {"content": "partial response text"}
data: {"content": "more response text"}
...
data: [DONE]
```

## Implementation Notes

1. In-Memory Storage:
   - Using Go map for storing conversations
   - Data will be lost on server restart (temporary storage for POC)

2. OpenAI Integration:
   - Using OpenAI's API for chat completions
   - Streaming responses using SSE (Server-Sent Events)
   - Model: gpt-3.5-turbo or gpt-4 (configurable)

3. Error Handling:
   - 404: Conversation not found
   - 400: Invalid request format
   - 500: OpenAI API errors or internal server errors
