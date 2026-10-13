terraform {
  required_version = ">= 1.5.0"

  cloud {
    organization = "krishdakhole3-org"

    workspaces {
      name = "student-task-management"
    }
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {}
