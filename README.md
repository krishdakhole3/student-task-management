# Automated Deployment of a Serverless Student Task Management Application Using Terraform

## Project Overview

This project implements a serverless Student Task Management application using Cloudflare Workers, Cloudflare Workers KV, and Terraform.

Terraform is used to manage infrastructure, while GitHub Actions automates Terraform validation and deployment.

An additional Model Context Protocol (MCP) server extension allows compatible MCP clients to interact with the task management API through structured tools.

## Technologies Used

- Cloudflare Workers
- Cloudflare Workers KV
- Terraform
- GitHub Actions
- Git and GitHub
- Node.js
- JavaScript
- Model Context Protocol (MCP)
- HTML, CSS, and JavaScript

## Features

- Create new tasks
- Retrieve individual tasks
- List tasks
- Update task details and completion status
- Delete tasks
- Store task data in Cloudflare Workers KV
- Manage infrastructure using Terraform
- Automate validation and deployment through GitHub Actions
- Integrate task operations through an MCP server

## Architecture

AI Assistant or MCP Client
        |
        v
MCP Server
        |
        v
Cloudflare Worker REST API
        |
        v
Cloudflare Workers KV

Terraform manages the infrastructure, and GitHub Actions supports the CI/CD workflow.

## MCP Server Tools

The MCP server provides five tools:

| Tool | Description |
|---|---|
| `list_tasks` | Retrieve all tasks |
| `add_task` | Create a new task |
| `get_task` | Retrieve a task by ID |
| `update_task` | Update task details or completion status |
| `delete_task` | Delete a task by ID |

## Project Structure

```text
student-task-management/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── frontend/
│   └── index.html
├── worker/
│   ├── index.js
│   └── wrangler.toml
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── versions.tf
├── mcp-server/
│   ├── index.js
│   ├── test-mcp.js
│   ├── package.json
│   └── package-lock.json
└── .gitignore
