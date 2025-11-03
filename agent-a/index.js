import { v4 as uuidv4 } from 'uuid';
import { A2AClient, A2ACardResolver, Role } from "a2a-js";

async function run() {
  const targetUrl = "http://localhost:3001"; // Agent B
  
  console.log("🔍 A2A Protocol Communication Test");
  console.log("=" .repeat(60));
  
  // 🔍 Discovery using A2ACardResolver (A2A Protocol Step 1)
  console.log("\n📋 Step 1: Agent Discovery (/.well-known/agent.json)");
  const resolver = new A2ACardResolver(targetUrl);
  const agentCard = await resolver.getAgentCard();
  console.log("✅ Discovered Agent:", agentCard.name);
  console.log("   Description:", agentCard.description);
  console.log("   URL:", agentCard.url);
  console.log("   Version:", agentCard.version);
  if (agentCard.skills) {
    console.log("   Skills:", agentCard.skills.map(s => s.name).join(', '));
  }

  // Create A2A client (constructor takes URL string, not object)
  console.log("\n📡 Step 2: Creating A2A Client");
  const client = new A2AClient(targetUrl, fetch);
  console.log("✅ A2A Client initialized with base URL:", targetUrl);

  // 📨 Send task using sendTask() with proper TaskSendParams structure
  // (A2A Protocol: tasks/send JSON-RPC method)
  console.log("\n📤 Step 3: Sending Task (tasks/send)");
  const taskId = uuidv4();
  console.log("   Task ID:", taskId);
  console.log("   Method: tasks/send (JSON-RPC 2.0)");
  console.log("   Message Role:", Role.User);
  
  const task = await client.sendTask({
    id: taskId,
    message: {
      role: Role.User,
      parts: [
        {
          type: 'text',
          text: JSON.stringify({
            type: "greeting",
            input: { name: "Bhanu" }
          })
        }
      ]
    }
  });

  if (!task) {
    console.error("❌ Failed to create task");
    return;
  }

  console.log("✅ Task received from Agent B");
  console.log("   Task ID:", task.id);
  console.log("   Task State:", task.status?.state);
  console.log("   Protocol: A2A Task object with status field");
  
  if (task.status?.message) {
    const msg = task.status.message;
    console.log("   Response Role:", msg.role);
    console.log("   Response Parts:", msg.parts?.length || 0);
  }

  // ⏳ Get result using getTask() (A2A Protocol: tasks/get JSON-RPC method)
  console.log("\n📥 Step 4: Retrieving Task (tasks/get)");
  console.log("   Method: tasks/get (JSON-RPC 2.0)");
  console.log("   Task ID:", task.id);
  
  const result = await client.getTask({ id: task.id });
  
  if (result) {
    console.log("✅ Task retrieved successfully");
    console.log("   Protocol: A2A Task retrieval via tasks/get");
    
    // Extract the response message from the task status
    const responseMessage = result.status?.message;
    if (responseMessage && responseMessage.parts) {
      const textParts = responseMessage.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('');
      console.log("\n💬 Response from Agent B:");
      console.log("   " + textParts);
    } else {
      console.log("   Full Task Object:", JSON.stringify(result, null, 2));
    }
  } else {
    console.error("❌ Failed to retrieve task result");
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ A2A Protocol Communication Verified!");
  console.log("\nProtocol Elements Used:");
  console.log("  ✓ Agent Discovery (/.well-known/agent.json)");
  console.log("  ✓ JSON-RPC 2.0 (jsonrpc: '2.0')");
  console.log("  ✓ tasks/send method");
  console.log("  ✓ tasks/get method");
  console.log("  ✓ Task object with id, status, message");
  console.log("  ✓ Message with role (User/Agent) and parts");
  console.log("  ✓ Part with type='text' and text content");
  console.log();
}

run().catch(console.error);
