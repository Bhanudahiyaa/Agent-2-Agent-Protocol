# A2A Protocol Verification Guide

This guide explains how to verify that Agent A and Agent B are communicating using the **Agent 2 Agent (A2A) Protocol**.

## 🔍 Ways to Verify Protocol Compliance

### Method 1: Run the Automated Verification Script

The easiest way to verify protocol compliance is to run the automated verification script:

```bash
# Make sure Agent B is running first
cd agent-b
node index.js

# In another terminal, run the verification script
cd ..
node verify-protocol.js
```

This script checks:
- ✅ Agent Card Discovery (`/.well-known/agent.json`)
- ✅ JSON-RPC 2.0 structure
- ✅ A2A Protocol endpoints
- ✅ Task/Message structure compliance
- ✅ Protocol methods (`tasks/send`, `tasks/get`, etc.)

### Method 2: Enhanced Logging in Agent A

When you run Agent A, it now shows detailed protocol information:

```bash
cd agent-a
node index.js
```

You'll see output like:
```
🔍 A2A Protocol Communication Test
============================================================

📋 Step 1: Agent Discovery (/.well-known/agent.json)
✅ Discovered Agent: Responder Agent
   Description: Handles greeting tasks and replies politely.
   URL: http://localhost:3001/
   Version: 1.0.0
   Skills: Greeting Handler

📡 Step 2: Creating A2A Client
✅ A2A Client initialized with base URL: http://localhost:3001

📤 Step 3: Sending Task (tasks/send)
   Task ID: [uuid]
   Method: tasks/send (JSON-RPC 2.0)
   Message Role: user

📥 Step 4: Retrieving Task (tasks/get)
   Method: tasks/get (JSON-RPC 2.0)
   Task ID: [uuid]
```

### Method 3: Manual Protocol Inspection

#### 1. Check Agent Card Discovery

```bash
curl -v http://localhost:3001/.well-known/agent.json
```

Should return a JSON object with:
- `name`: Agent name
- `description`: Agent description
- `url`: Agent URL
- `version`: Protocol version
- `skills`: Array of agent capabilities
- `capabilities`: Object with protocol capabilities

#### 2. Inspect JSON-RPC Requests

Monitor the actual HTTP requests using a tool like:
- Browser DevTools (Network tab)
- `curl` with verbose output
- HTTP proxy tools (like Burp Suite or mitmproxy)

**Example JSON-RPC Request (tasks/send):**
```json
{
  "jsonrpc": "2.0",
  "id": "request-id",
  "method": "tasks/send",
  "params": {
    "id": "task-uuid",
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "..."
        }
      ]
    }
  }
}
```

**Example JSON-RPC Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "request-id",
  "result": {
    "id": "task-uuid",
    "status": {
      "state": "completed",
      "message": {
        "role": "agent",
        "parts": [...]
      },
      "timestamp": "2024-..."
    },
    "history": [...]
  }
}
```

#### 3. Verify Protocol Structure

The A2A Protocol requires:

**Agent Discovery:**
- ✅ `GET /.well-known/agent.json` endpoint
- ✅ Returns valid Agent Card JSON

**JSON-RPC 2.0:**
- ✅ All requests have `jsonrpc: "2.0"`
- ✅ All requests have `id` field
- ✅ All requests have `method` field
- ✅ All requests have `params` field
- ✅ Responses have `jsonrpc: "2.0"` and `id`
- ✅ Responses have either `result` or `error`

**Task Object:**
- ✅ Has `id` field (string UUID)
- ✅ Has `status` field (object)
- ✅ `status.state` is one of: `submitted`, `working`, `completed`, `failed`, etc.
- ✅ `status.message` is a Message object (optional)
- ✅ `history` is an array of Message objects (optional)

**Message Object:**
- ✅ Has `role` field (`"user"` or `"agent"`)
- ✅ Has `parts` array (at least one part)
- ✅ Each part has `type` field (`"text"`, `"data"`, or `"file"`)
- ✅ Text parts have `text` field
- ✅ Data parts have `data` field
- ✅ File parts have `file` field

**Protocol Methods:**
- ✅ `tasks/send` - Send a task
- ✅ `tasks/get` - Get task status
- ✅ `tasks/cancel` - Cancel a task
- ✅ `message/send` - Send a message (stateless)
- ✅ `tasks/sendSubscribe` - Stream task updates

### Method 4: Use Network Inspection Tools

#### Using curl to inspect requests:

```bash
# Send a task and see the raw request/response
curl -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-1",
    "method": "tasks/send",
    "params": {
      "id": "test-task-123",
      "message": {
        "role": "user",
        "parts": [{"type": "text", "text": "Hello"}]
      }
    }
  }' \
  -v
```

#### Using browser DevTools:

1. Open Browser DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Run Agent A
5. Inspect the requests to see:
   - Request URL
   - Request method (GET/POST)
   - Request headers
   - Request payload (JSON-RPC structure)
   - Response headers
   - Response body (JSON-RPC response)

## ✅ Protocol Compliance Checklist

When verifying protocol compliance, ensure:

- [ ] Agent Card is accessible at `/.well-known/agent.json`
- [ ] All requests use JSON-RPC 2.0 format
- [ ] All requests have `jsonrpc: "2.0"` field
- [ ] All requests have `method` field matching A2A methods
- [ ] Task objects have required fields (`id`, `status`)
- [ ] Message objects have required fields (`role`, `parts`)
- [ ] Parts have correct structure based on type
- [ ] Responses follow JSON-RPC 2.0 format
- [ ] Task states are valid A2A states
- [ ] Roles are either `"user"` or `"agent"`

## 📚 Reference

- [A2A Protocol Specification](https://google.github.io/A2A/specification/)
- [A2A Protocol Documentation](https://google.github.io/A2A/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

## 🎯 Quick Test

Run this one-liner to quickly verify Agent B is responding with A2A protocol:

```bash
curl -s http://localhost:3001/.well-known/agent.json | jq '.name, .version, .url'
```

Expected output:
```
"Responder Agent"
"1.0.0"
"http://localhost:3001/"
```

