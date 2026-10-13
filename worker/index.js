const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/health" && method === "GET") {
      return jsonResponse({
        message: "Student Task Management API is running!",
      });
    }

    if (!url.pathname.startsWith("/api/tasks")) {
      return jsonResponse({ error: "Route not found" }, 404);
    }

    if (!env.TASKS) {
      return jsonResponse(
        { error: "Task storage is not configured yet" },
        500
      );
    }

    try {
      if (url.pathname === "/api/tasks" && method === "GET") {
        const list = await env.TASKS.list();
        const tasks = await Promise.all(
          list.keys.map(async (key) => {
            const value = await env.TASKS.get(key.name);
            return value ? JSON.parse(value) : null;
          })
        );

        return jsonResponse(tasks.filter(Boolean));
      }

      if (url.pathname === "/api/tasks" && method === "POST") {
        const body = await request.json();
        const title = String(body.title || "").trim();

        if (!title) {
          return jsonResponse({ error: "Task title is required" }, 400);
        }

        const task = {
          id: crypto.randomUUID(),
          title,
          description: String(body.description || "").trim(),
          completed: false,
          createdAt: new Date().toISOString(),
        };

        await env.TASKS.put(task.id, JSON.stringify(task));

        return jsonResponse(task, 201);
      }

      const match = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);

      if (match) {
        const id = decodeURIComponent(match[1]);
        const savedTask = await env.TASKS.get(id);

        if (!savedTask) {
          return jsonResponse({ error: "Task not found" }, 404);
        }

        const task = JSON.parse(savedTask);

        if (method === "GET") {
          return jsonResponse(task);
        }

        if (method === "PUT") {
          const body = await request.json();

          if (body.title !== undefined) {
            const title = String(body.title).trim();

            if (!title) {
              return jsonResponse({ error: "Task title cannot be empty" }, 400);
            }

            task.title = title;
          }

          if (body.description !== undefined) {
            task.description = String(body.description).trim();
          }

          if (body.completed !== undefined) {
            if (typeof body.completed !== "boolean") {
              return jsonResponse(
                { error: "completed must be true or false" },
                400
              );
            }

            task.completed = body.completed;
          }

          await env.TASKS.put(id, JSON.stringify(task));
          return jsonResponse(task);
        }

        if (method === "DELETE") {
          await env.TASKS.delete(id);
          return jsonResponse({ message: "Task deleted successfully" });
        }
      }

      return jsonResponse({ error: "Method or route not found" }, 404);
    } catch (error) {
      console.error(error);
      return jsonResponse({ error: "Invalid request or server error" }, 500);
    }
  },
};