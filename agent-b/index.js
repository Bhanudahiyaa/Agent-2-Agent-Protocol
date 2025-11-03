import { Role, A2AServer, DefaultA2ARequestHandler, OperationNotSupportedError, TaskState } from 'a2a-js';

/**
 * Greeting Agent implementation
 * Handles greeting tasks and replies politely
 */
class GreetingAgent {
  async handleGreeting(input) {
    const name = input?.name || 'friend';
    return `Hey ${name}, greetings from Agent B 🤝`;
  }
}

/**
 * Agent Executor that implements the A2A AgentExecutor interface
 */
class GreetingAgentExecutor {
  constructor() {
    this.agent = new GreetingAgent();
  }

  async onMessageSend(request, task) {
    try {
      // Extract message text from the request
      const messageText = request.params.message.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('');

      // Parse the JSON payload sent by Agent A
      let taskData;
      try {
        taskData = JSON.parse(messageText);
      } catch (e) {
        // If not JSON, treat as plain text
        taskData = { type: 'greeting', input: { message: messageText } };
      }

      // Handle greeting task
      let result;
      if (taskData.type === 'greeting') {
        result = await this.agent.handleGreeting(taskData.input);
      } else {
        result = 'Unsupported task type';
      }

      // Create the agent's response message
      const agentMessage = {
        role: Role.Agent,
        parts: [{ type: 'text', text: result }]
      };

      // Check if this is a tasks/send request (has task id in params)
      const isTaskRequest = request.params.id;
      
      if (isTaskRequest) {
        // For tasks/send, create or update the task
        const taskId = request.params.id;
        const sessionId = request.params.sessionId || null;
        
        // Use existing task or create a new one
        const taskObj = task || {
          id: taskId,
          sessionId: sessionId,
          status: {
            state: TaskState.Working,
            message: null,
            timestamp: new Date().toISOString()
          },
          history: [],
          metadata: {}
        };
        
        // Update the task with completed status
        taskObj.status = {
          state: TaskState.Completed,
          message: agentMessage,
          timestamp: new Date().toISOString()
        };
        
        // Ensure history exists
        if (!taskObj.history) {
          taskObj.history = [];
        }
        // Add user message to history if not already there
        const userMessage = request.params.message;
        const userMessageExists = taskObj.history.some(msg => 
          JSON.stringify(msg) === JSON.stringify(userMessage)
        );
        if (!userMessageExists) {
          taskObj.history.push(userMessage);
        }
        // Add agent response to history
        taskObj.history.push(agentMessage);

        return {
          jsonrpc: '2.0',
          id: request.id,
          result: taskObj  // Return Task for tasks/send
        };
      } else {
        // Return Message for message/send
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: agentMessage
        };
      }
    } catch (error) {
      // Return error response
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32000,
          message: error.message || 'Internal error'
        }
      };
    }
  }

  async *onMessageStream(request, task) {
    // For simplicity, we'll handle streaming the same way as non-streaming
    // but yield the result as a single chunk
    const response = await this.onMessageSend(request, task);
    if (response.result) {
      yield {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          type: 'taskStatusUpdate',
          status: {
            state: 'completed',
            message: response.result
          }
        }
      };
    } else {
      yield {
        jsonrpc: '2.0',
        id: request.id,
        error: response.error
      };
    }
  }

  async onCancel(request, task) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: new OperationNotSupportedError()
    };
  }

  async *onResubscribe(request, task) {
    yield {
      jsonrpc: '2.0',
      id: request.id,
      error: new OperationNotSupportedError()
    };
  }
}

// Define the agent card (metadata about this agent)
const skill = {
  id: 'greeting',
  name: 'Greeting Handler',
  description: 'Handles greeting tasks and replies politely',
  tags: ['greeting', 'social'],
  examples: ['greeting', 'hello']
};

const agentCard = {
  name: 'Responder Agent',
  description: 'Handles greeting tasks and replies politely.',
  url: 'http://localhost:3001/',
  version: '1.0.0',
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  capabilities: { streaming: true },
  skills: [skill],
  authentication: {
    schemes: ['public']
  }
};

// Create a custom request handler that properly saves tasks
// The default handler checks for "taskId" but Task objects have "id"
class CustomRequestHandler extends DefaultA2ARequestHandler {
  async onMessageSend(request) {
    // Call parent method to handle the basic logic
    const response = await super.onMessageSend(request);
    
    // Additionally save the task if it's a Task object (has id and status)
    // This fixes the bug where the default handler only checks for "taskId"
    if ("result" in response &&
        response.result &&
        typeof response.result === "object" &&
        "id" in response.result &&
        "status" in response.result) {
      // This is a Task object, ensure it's saved
      await this.taskStore.save(response.result);
    }
    
    return response;
  }
}

// Create the request handler with our executor
const requestHandler = new CustomRequestHandler(new GreetingAgentExecutor());

// Create and start the A2A server
const server = new A2AServer(agentCard, requestHandler);

const port = 3001;
server.start({ port });

console.log(`🧠 Agent B running on http://localhost:${port}`);
console.log(`📋 Agent Card available at http://localhost:${port}/.well-known/agent.json`);
console.log(`\n📡 A2A Protocol Endpoints:`);
console.log(`   GET  /.well-known/agent.json  - Agent Discovery`);
console.log(`   POST /                        - JSON-RPC 2.0 Endpoint`);
console.log(`\n📝 Supported JSON-RPC Methods:`);
console.log(`   - tasks/send                  - Send a task`);
console.log(`   - tasks/get                   - Get task status`);
console.log(`   - tasks/cancel                - Cancel a task`);
console.log(`   - message/send                - Send a message`);
console.log(`   - tasks/sendSubscribe         - Streaming tasks`);
console.log(`\n🔍 Protocol Verification:`);
console.log(`   Run: node ../verify-protocol.js`);
console.log();
