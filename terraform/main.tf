resource "cloudflare_workers_kv_namespace" "tasks" {
  account_id = var.cloudflare_account_id
  title      = "TASKS"
}
resource "cloudflare_workers_script" "student_task_api" {
  account_id  = var.cloudflare_account_id
  script_name = "student-task-api"

  content_file   = "${path.module}/../worker/index.js"
  content_sha256 = filesha256("${path.module}/../worker/index.js")

  main_module       = "index.js"
  compatibility_date = "2026-10-13"

  bindings = [
    {
      name         = "TASKS"
      type         = "kv_namespace"
      namespace_id = cloudflare_workers_kv_namespace.tasks.id
    }
  ]
}