variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "master-cms.com"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "master-cms-cluster"
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_groups" {
  description = "EKS node groups configuration"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    desired_size   = number
    min_size       = number
    max_size       = number
    labels         = map(string)
    taints         = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  default = {
    general = {
      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
      desired_size   = 2
      min_size       = 1
      max_size       = 5
      labels = {
        Environment = "dev"
        Project     = "master-cms"
      }
      taints = []
    }
    monitoring = {
      instance_types = ["t3.small"]
      capacity_type  = "ON_DEMAND"
      desired_size   = 1
      min_size       = 1
      max_size       = 3
      labels = {
        Environment = "dev"
        Project     = "master-cms"
        Role        = "monitoring"
      }
      taints = [{
        key    = "dedicated"
        value  = "monitoring"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}

variable "database_config" {
  description = "RDS database configuration"
  type = object({
    engine_version = string
    instance_class = string
    instances      = number
    storage_encrypted = bool
  })
  default = {
    engine_version    = "15.4"
    instance_class    = "db.serverless"
    instances         = 2
    storage_encrypted = true
  }
}

variable "redis_config" {
  description = "ElastiCache Redis configuration"
  type = object({
    node_type = string
    num_cache_nodes = number
    parameter_group_name = string
  })
  default = {
    node_type = "cache.t3.micro"
    num_cache_nodes = 2
    parameter_group_name = "default.redis7"
  }
}

variable "s3_config" {
  description = "S3 bucket configuration"
  type = object({
    versioning_enabled = bool
    encryption_enabled = bool
    lifecycle_rules = list(object({
      id      = string
      enabled = bool
      expiration_days = number
    }))
  })
  default = {
    versioning_enabled = true
    encryption_enabled = true
    lifecycle_rules = [{
      id      = "media-cleanup"
      enabled = true
      expiration_days = 365
    }]
  }
}

variable "cloudfront_config" {
  description = "CloudFront distribution configuration"
  type = object({
    enabled = bool
    price_class = string
    default_root_object = string
    aliases = list(string)
  })
  default = {
    enabled = true
    price_class = "PriceClass_100"
    default_root_object = "index.html"
    aliases = []
  }
}

variable "monitoring_config" {
  description = "Monitoring configuration"
  type = object({
    prometheus_retention_days = number
    grafana_admin_password = string
    alerting_enabled = bool
  })
  default = {
    prometheus_retention_days = 15
    grafana_admin_password = "admin123"
    alerting_enabled = true
  }
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "master-cms"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
} 