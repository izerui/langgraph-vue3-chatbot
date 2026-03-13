curl -X POST http://localhost:2024/runs/stream \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
        "messages": [
             {"role": "system", "content": "你是一个专业的技术顾问，擅长回答编程问题。"},
             {"role": "user", "content": "测试10个待办，一个一个来，创建10个待办事项，每个事项都会有一个简短的标题和一个未来的截止日期，慢一点，每个待办都要有标题和截止日期，标题要简短，截止日期要在未来。"}
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
