# Master CMS Infrastructure Documentation

## Overview

This directory contains the complete infrastructure setup for the Master CMS Framework, designed to support multi-site deployment across different media companies. The infrastructure is built using modern cloud-native technologies with a focus on scalability, security, and operational excellence.

## Architecture

### Multi-Site Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Site 1        │    │   Site 2        │    │   Site 3        │
│   (himaya.io)   │    │   (cryptonews)  │    │   (iktissad)    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Namespace:      │    │ Namespace:      │    │ Namespace:      │
│ himaya-prod     │    │ cryptonews-prod │    │ iktissad-prod   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Database:       │    │ Database:       │    │ Database:       │
│ himaya-db       │    │ cryptonews-db   │    │ iktissad-db     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Shared Services │
                    ├─────────────────┤
                    │ • Monitoring    │
                    │ • Logging       │
                    │ • CDN           │
                    │ • Registry      │
                    └─────────────────┘
```

### Technology Stack

- **Container Orchestration**: Kubernetes (EKS)
- **Infrastructure as Code**: Terraform
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Ingress**: NGINX Ingress Controller
- **SSL/TLS**: cert-manager with Let's Encrypt
- **Database**: PostgreSQL (Aurora)
- **Caching**: Redis (ElastiCache)
- **Storage**: S3 + CloudFront CDN
- **Container Registry**: GitHub Container Registry

## Directory Structure

```
infrastructure/
├── kubernetes/
│   ├── base/                    # Base Kubernetes resources
│   │   ├── namespace.yaml       # Base namespace and RBAC
│   │   ├── ingress-controller.yaml  # NGINX ingress controller
│   │   └── cert-manager.yaml    # SSL certificate management
│   ├── sites/
│   │   └── site-template.yaml   # Template for individual sites
│   └── monitoring/
│       ├── prometheus.yaml       # Prometheus monitoring
│       └── grafana.yaml          # Grafana dashboards
├── terraform/
│   ├── main.tf                  # Main Terraform configuration
│   ├── variables.tf             # Terraform variables
│   └── outputs.tf               # Terraform outputs
├── scripts/
│   └── deploy-site.sh           # Site deployment script
└── README.md                    # This file
```

## Prerequisites

### Required Tools

1. **kubectl** (v1.28+)
2. **Terraform** (v1.5+)
3. **AWS CLI** (v2.0+)
4. **Docker** (v20.0+)
5. **Git** (v2.0+)

### AWS Requirements

1. **AWS Account** with appropriate permissions
2. **IAM User** with EKS, RDS, ElastiCache, S3, and CloudFront permissions
3. **Route53** hosted zone for domain management
4. **ACM Certificate** for SSL/TLS

### GitHub Requirements

1. **GitHub Repository** with Actions enabled
2. **GitHub Secrets** configured:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `SLACK_WEBHOOK_URL` (optional)

## Quick Start

### 1. Infrastructure Setup

```bash
# Navigate to terraform directory
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan the infrastructure
terraform plan

# Apply the infrastructure
terraform apply
```

### 2. Deploy Base Infrastructure

```bash
# Deploy base Kubernetes resources
kubectl apply -f infrastructure/kubernetes/base/

# Deploy monitoring stack
kubectl apply -f infrastructure/kubernetes/monitoring/
```

### 3. Deploy a Site

```bash
# Deploy a single site
./infrastructure/scripts/deploy-site.sh himaya staging

# Deploy with custom options
./infrastructure/scripts/deploy-site.sh cryptonews production --dry-run
```

## Deployment Process

### Automated Deployment (GitHub Actions)

The CI/CD pipeline automatically handles:

1. **Build & Test**: Compiles the application and runs tests
2. **Security Scan**: Scans for vulnerabilities using Trivy
3. **Infrastructure Validation**: Validates Terraform configurations
4. **Multi-Environment Deployment**: Deploys to dev/staging/production
5. **Health Checks**: Verifies deployment success

### Manual Deployment

For manual deployments, use the deployment script:

```bash
# Development deployment
./infrastructure/scripts/deploy-site.sh himaya dev

# Staging deployment
./infrastructure/scripts/deploy-site.sh himaya staging

# Production deployment
./infrastructure/scripts/deploy-site.sh himaya production
```

## Configuration Management

### Environment Variables

Each site can be configured using environment variables:

```bash
# Site-specific configuration
SITE_NAME=himaya
SITE_DOMAIN=himaya.master-cms.com
DATABASE_URL=postgresql://himaya_user:password@himaya-db:5432/himaya_db
REDIS_URL=redis://himaya-redis:6379

# AI and external services
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
STRIPE_SECRET_KEY=your_stripe_key
```

### Site Configuration

Each site gets its own:
- **Namespace**: Isolated Kubernetes namespace
- **Database**: Separate PostgreSQL instance
- **Redis**: Dedicated Redis cluster
- **Storage**: Isolated S3 bucket
- **Domain**: Custom subdomain
- **SSL Certificate**: Automatic SSL provisioning

## Monitoring & Observability

### Prometheus Metrics

The following metrics are collected:

- **Application Metrics**: Request rate, response time, error rate
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Database Metrics**: Connection count, query performance
- **Custom Metrics**: Business-specific KPIs

### Grafana Dashboards

Pre-configured dashboards include:

- **Site Overview**: Overall health and performance
- **Application Performance**: Response times and error rates
- **Infrastructure Health**: Resource utilization
- **Database Performance**: Query performance and connections

### Alerting

Alerts are configured for:

- **High CPU/Memory Usage**: >80% for 5 minutes
- **Application Down**: No response for 1 minute
- **High Response Time**: >2 seconds 95th percentile
- **Database Issues**: Connection errors or high latency

## Security

### Network Security

- **VPC Isolation**: Each environment in separate VPC
- **Security Groups**: Restrictive firewall rules
- **Network Policies**: Kubernetes network policies
- **Private Subnets**: Application workloads in private subnets

### Access Control

- **RBAC**: Role-based access control in Kubernetes
- **IAM Roles**: AWS IAM roles for service accounts
- **Secrets Management**: Kubernetes secrets for sensitive data
- **Certificate Management**: Automatic SSL certificate rotation

### Data Protection

- **Encryption at Rest**: All data encrypted using AWS KMS
- **Encryption in Transit**: TLS 1.3 for all communications
- **Backup Encryption**: Automated encrypted backups
- **Audit Logging**: Comprehensive audit trails

## Backup & Disaster Recovery

### Automated Backups

- **Database Backups**: Daily automated backups with 30-day retention
- **File Backups**: S3 versioning for media files
- **Configuration Backups**: Git-based configuration management
- **Cross-Region Replication**: Critical data replicated across regions

### Recovery Procedures

1. **Database Recovery**: Point-in-time recovery from backups
2. **Application Recovery**: Blue-green deployment with rollback
3. **Infrastructure Recovery**: Terraform-based infrastructure recreation
4. **Data Recovery**: S3 cross-region replication for data recovery

## Cost Optimization

### Resource Management

- **Auto-scaling**: Horizontal and vertical pod autoscaling
- **Spot Instances**: Use of spot instances for non-critical workloads
- **Resource Quotas**: Per-namespace resource limits
- **Storage Optimization**: S3 lifecycle policies for cost optimization

### Monitoring & Alerts

- **Cost Alerts**: Monthly cost threshold alerts
- **Resource Utilization**: Monitor and optimize resource usage
- **Idle Resource Cleanup**: Automated cleanup of unused resources
- **Right-sizing**: Regular review and optimization of resource allocation

## Troubleshooting

### Common Issues

1. **Deployment Failures**
   ```bash
   # Check deployment status
   kubectl get deployments -n <namespace>
   
   # View deployment logs
   kubectl logs -f deployment/<app-name> -n <namespace>
   ```

2. **Database Connection Issues**
   ```bash
   # Check database connectivity
   kubectl exec -it deployment/<app-name> -n <namespace> -- nc -zv <db-host> 5432
   
   # View database logs
   kubectl logs -f deployment/<db-name> -n <namespace>
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   kubectl get certificates -n <namespace>
   
   # View cert-manager logs
   kubectl logs -f deployment/cert-manager -n cert-manager
   ```

### Debugging Commands

```bash
# Check cluster health
kubectl get nodes
kubectl get pods --all-namespaces

# Check ingress status
kubectl get ingress --all-namespaces
kubectl describe ingress <ingress-name> -n <namespace>

# Check monitoring
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```

## Maintenance

### Regular Maintenance Tasks

1. **Security Updates**: Monthly security patches
2. **Certificate Renewal**: Automatic SSL certificate renewal
3. **Backup Verification**: Weekly backup restoration tests
4. **Performance Tuning**: Monthly performance reviews
5. **Cost Optimization**: Monthly cost analysis and optimization

### Update Procedures

1. **Application Updates**: Blue-green deployment with rollback
2. **Infrastructure Updates**: Terraform-based infrastructure updates
3. **Kubernetes Updates**: Rolling updates with zero downtime
4. **Database Updates**: Maintenance windows with backup verification

## Support

### Getting Help

1. **Documentation**: Check this README and inline documentation
2. **Logs**: Use kubectl logs and monitoring dashboards
3. **Issues**: Create GitHub issues for bugs and feature requests
4. **Discussions**: Use GitHub Discussions for questions and ideas

### Contributing

1. **Infrastructure Changes**: Submit pull requests with Terraform changes
2. **Documentation**: Update documentation for any infrastructure changes
3. **Testing**: Test changes in development environment first
4. **Review**: All changes require code review before merging

## License

This infrastructure code is part of the Master CMS Framework and follows the same licensing terms as the main project. 