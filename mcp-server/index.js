const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

const API_BASE_URL = "https://student-task-api.krishdakhole3.workers.dev";

const server = new McpServer({
  name: "student-task-management",
  version: "1.0.0",
});

// Helper function to call the existing Cloudflare Worker API.
async function callApi(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("The API returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(data.error || `API request failed: ${response.status}`);
  }

  return data;
}

// Tool 1: List all tasks.
server.registerTool(
  "list_tasks",
  {
    description: "Retrieve all tasks from the Student Task Management application.",
    inputSchema: {},
  },
  async () => {
    const tasks = await callApi("/api/tasks");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(tasks, null, 2),
        },
      ],
    };
  }
);

// Tool 2: Add a task.
server.registerTool(
  "add_task",
  {
    description: "Create a new task with a title and optional description.",
    inputSchema: {
      title: z.string().trim().min(1).describe("Title of the new task"),
      description: z
        .string()
        .optional()
        .describe("Optional description of the task"),
    },
  },
  async ({ title, description }) => {
    const task = await callApi("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(task, null, 2),
        },
      ],
    };
  }
);

// Tool 3: Get one task by its ID.
server.registerTool(
  "get_task",
  {
    description: "Retrieve a single task using its task ID.",
    inputSchema: {
      id: z.string().min(1).describe("ID of the task"),
    },
  },
  async ({ id }) => {
    const task = await callApi(`/api/tasks/${encodeURIComponent(id)}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(task, null, 2),
        },
      ],
    };
  }
);

// Tool 4: Update a task.
server.registerTool(
  "update_task",
  {
    description: "Update a task's title, description, or completion status.",
    inputSchema: {
      id: z.string().min(1).describe("ID of the task to update"),
      title: z.string().trim().min(1).optional().describe("New task title"),
      description: z.string().optional().describe("New task description"),
      completed: z.boolean().optional().describe("Whether the task is completed"),
    },
  },
  async ({ id, ...updates }) => {
    if (Object.keys(updates).length === 0) {
      throw new Error("Provide at least one field to update.");
    }

    const task = await callApi(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(task, null, 2),
        },
      ],
    };
  }
);

// Tool 5: Delete a task.
server.registerTool(
  "delete_task",
  {
    description: "Delete a task using its task ID.",
    inputSchema: {
      id: z.string().min(1).describe("ID of the task to delete"),
    },
  },
  async ({ id }) => {
    const result = await callApi(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Start the MCP server using standard input/output.
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("MCP Server failed to start:", error);
  process.exit(1);
});