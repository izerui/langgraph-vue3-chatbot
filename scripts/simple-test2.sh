curl -X POST http://localhost:2024/runs/stream \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
        "messages": [
             {"role": "system", "content": "你是一个专业的技术顾问，擅长回答编程问题。"},
             {"role": "user", "content": "你好，请介绍一下自己"}
        ]
    },
    "config": {
        "tags": [
            "serv"
        ],
        "metadata": {
            "chat_title": "langgraph",
            "chat_client": "agent-chat-ui"
        },
        "configurable": {
            "model_provider": "openai",
            "model": "MiniMax/MiniMax-M2.5",
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"
        }
    },
    "metadata": {
        "user_id": "user001",
        "name": "langgraph"
    },
    "stream_mode": [
        "messages-tuple",
        "custom"
    ],
    "stream_resumable": false,
    "assistant_id": "research",
    "on_disconnect": "cancel"
}'