variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "domain_name" {
  description = "The domain name registered in Cloudflare"
  type        = string
  default     = "judkinsparkforpeople.org"
}
