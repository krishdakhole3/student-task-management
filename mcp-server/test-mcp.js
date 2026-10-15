const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["index.js"],
  });

  const client = new Client({
    name: "student-task-mcp-test",
    version: "1.0.0",
  });

  let testTaskId;
  let testFailed = false;

  try {
    // 1. Connect to MCP server
    await client.connect(transport);
    console.log("1. MCP connection: PASS");

    // 2. Check available tools
    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((tool) => tool.name);

    const requiredTools = [
      "list_tasks",
      "add_task",
      "get_task",
      "update_task",
      "delete_task",
    ];

    for (const name of requiredTools) {
      if (!toolNames.includes(name)) {
        throw new Error(`Required MCP tool is missing: ${name}`);
      }
    }

    console.log("2. All five MCP tools are available: PASS");

    // 3. List existing tasks
    const listResult = await client.callTool({
      name: "list_tasks",
      arguments: {},
    });

    if (listResult.isError) {
      throw new Error("list_tasks failed");
    }

    console.log("3. list_tasks: PASS");

    // 4. Create a temporary test task
    const addResult = await client.callTool({
      name: "add_task",
      arguments: {
        title: "Temporary MCP Integration Test",
        description: "This task is created and deleted by the test script.",
      },
    });

    if (addResult.isError) {
      throw new Error("add_task failed");
    }

    const addedTask = JSON.parse(addResult.content[0].text);
    testTaskId = addedTask.id;

    if (!testTaskId) {
      throw new Error("add_task did not return a task ID");
    }

    console.log("4. add_task: PASS");
    console.log(`   Created task ID: ${testTaskId}`);

    // 5. Retrieve the created task
    const getResult = await client.callTool({
      name: "get_task",
      arguments: { id: testTaskId },
    });

    if (getResult.isError) {
      throw new Error("get_task failed");
    }

    const retrievedTask = JSON.parse(getResult.content[0].text);

    if (retrievedTask.id !== testTaskId) {
      throw new Error("get_task returned an unexpected task");
    }

    console.log("5. get_task: PASS");

    // 6. Update the temporary task
    const updateResult = await client.callTool({
      name: "update_task",
      arguments: {
        id: testTaskId,
        title: "Temporary MCP Test Updated",
        completed: true,
      },
    });

    if (updateResult.isError) {
      throw new Error("update_task failed");
    }

    const updatedTask = JSON.parse(updateResult.content[0].text);

    if (
      updatedTask.id !== testTaskId ||
      updatedTask.title !== "Temporary MCP Test Updated" ||
      updatedTask.completed !== true
    ) {
      throw new Error("update_task returned unexpected values");
    }

    console.log("6. update_task: PASS");

    // 7. Verify the updated task directly using get_task
    // This avoids relying on an immediately updated KV list.
    const verifyResult = await client.callTool({
      name: "get_task",
      arguments: { id: testTaskId },
    });

    if (verifyResult.isError) {
      testFailed = true;
      console.error("7. Updated task verification: FAIL — get_task failed");
    } else {
      const verifiedTask = JSON.parse(verifyResult.content[0].text);

      if (
        verifiedTask.id === testTaskId &&
        verifiedTask.title === "Temporary MCP Test Updated" &&
        verifiedTask.completed === true
      ) {
        console.log("7. Updated task verification: PASS");
      } else {
        testFailed = true;
        console.error("7. Updated task verification: FAIL");
        console.log(
          "Actual task:",
          JSON.stringify(verifiedTask, null, 2)
        );
      }
    }
  } catch (error) {
    testFailed = true;
    console.error("\nMCP integration test failed:", error.message);
  } finally {
    // 8. Delete only the temporary task created by this test
    try {
      if (testTaskId) {
        const deleteResult = await client.callTool({
          name: "delete_task",
          arguments: { id: testTaskId },
        });

        if (deleteResult.isError) {
          testFailed = true;
          console.error("8. delete_task: FAIL");
        } else {
          console.log("8. delete_task (test task cleanup): PASS");

          // 9. Confirm the task no longer exists
          const checkResult = await client.callTool({
            name: "get_task",
            arguments: { id: testTaskId },
          });

          if (checkResult.isError) {
            console.log("9. Deleted task verification: PASS");
          } else {
            testFailed = true;
            console.error(
              "9. Deleted task verification: FAIL — task still exists."
            );
          }
        }
      }
    } catch (cleanupError) {
      testFailed = true;
      console.error("Cleanup error:", cleanupError.message);
    }

    await client.close();
  }

  if (testFailed) {
    process.exitCode = 1;
  } else {
    console.log("\nAll MCP integration tests passed! 🎉");
  }
}

main().catch((error) => {
  console.error("Unexpected test error:", error);
  process.exitCode = 1;
});