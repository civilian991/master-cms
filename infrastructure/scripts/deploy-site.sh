#!/bin/bash

# Master CMS Site Deployment Script
# Usage: ./deploy-site.sh <site_name> <environment> [options]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SITE_NAME=""
ENVIRONMENT=""
DOMAIN_SUFFIX=""
NAMESPACE_SUFFIX=""
KUBECONFIG=""
DRY_RUN=false
SKIP_VALIDATION=false
FORCE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 <site_name> <environment> [options]

Arguments:
  site_name     Name of the site (himaya, cryptonews, iktissad, technews)
  environment   Environment to deploy to (dev, staging, production)

Options:
  -h, --help              Show this help message
  -d, --dry-run          Perform a dry run without making changes
  -s, --skip-validation  Skip validation checks
  -f, --force            Force deployment even if validation fails
  -k, --kubeconfig       Path to kubeconfig file
  --domain-suffix        Custom domain suffix (default: based on environment)

Examples:
  $0 himaya staging
  $0 cryptonews production --dry-run
  $0 iktissad dev --force

EOF
}

# Function to validate site name
validate_site_name() {
    local valid_sites=("himaya" "cryptonews" "iktissad" "technews")
    for site in "${valid_sites[@]}"; do
        if [[ "$SITE_NAME" == "$site" ]]; then
            return 0
        fi
    done
    print_error "Invalid site name: $SITE_NAME"
    print_error "Valid sites: ${valid_sites[*]}"
    exit 1
}

# Function to validate environment
validate_environment() {
    local valid_envs=("dev" "staging" "production")
    for env in "${valid_envs[@]}"; do
        if [[ "$ENVIRONMENT" == "$env" ]]; then
            return 0
        fi
    done
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Valid environments: ${valid_envs[*]}"
    exit 1
}

# Function to set domain and namespace based on environment
set_environment_config() {
    case "$ENVIRONMENT" in
        "dev")
            DOMAIN_SUFFIX="dev.master-cms.com"
            NAMESPACE_SUFFIX="dev"
            ;;
        "staging")
            DOMAIN_SUFFIX="staging.master-cms.com"
            NAMESPACE_SUFFIX="staging"
            ;;
        "production")
            DOMAIN_SUFFIX="master-cms.com"
            NAMESPACE_SUFFIX="prod"
            ;;
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if required files exist
    local template_file="infrastructure/kubernetes/sites/site-template.yaml"
    if [[ ! -f "$template_file" ]]; then
        print_error "Template file not found: $template_file"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to validate site configuration
validate_site_config() {
    if [[ "$SKIP_VALIDATION" == true ]]; then
        print_warning "Skipping validation checks"
        return 0
    fi
    
    print_status "Validating site configuration..."
    
    local namespace="$SITE_NAME-$NAMESPACE_SUFFIX"
    local domain="$SITE_NAME.$DOMAIN_SUFFIX"
    
    # Check if namespace already exists
    if kubectl get namespace "$namespace" &> /dev/null; then
        if [[ "$FORCE" != true ]]; then
            print_error "Namespace $namespace already exists. Use --force to overwrite."
            exit 1
        else
            print_warning "Namespace $namespace already exists. Will overwrite due to --force flag."
        fi
    fi
    
    # Check if domain is available (basic DNS check)
    if nslookup "$domain" &> /dev/null; then
        print_warning "Domain $domain already resolves. Ensure it's configured correctly."
    fi
    
    print_success "Site configuration validation passed"
}

# Function to generate site configuration
generate_site_config() {
    print_status "Generating site configuration..."
    
    local template_file="infrastructure/kubernetes/sites/site-template.yaml"
    local output_file="/tmp/${SITE_NAME}-${ENVIRONMENT}.yaml"
    local namespace="$SITE_NAME-$NAMESPACE_SUFFIX"
    local domain="$SITE_NAME.$DOMAIN_SUFFIX"
    
    # Generate random passwords and secrets
    local db_password=$(openssl rand -base64 32)
    local redis_password=$(openssl rand -base64 32)
    local session_secret=$(openssl rand -base64 64)
    local jwt_secret=$(openssl rand -base64 64)
    
    # Replace placeholders in template
    sed -e "s/{{SITE_NAME}}/$SITE_NAME/g" \
        -e "s/{{SITE_DOMAIN}}/$domain/g" \
        -e "s/{{SITE_NAMESPACE}}/$namespace/g" \
        -e "s/{{SITE_NAME}}_db_password_base64/$(echo -n "$db_password" | base64)/g" \
        -e "s/{{SITE_NAME}}_redis_password_base64/$(echo -n "$redis_password" | base64)/g" \
        -e "s/{{SITE_NAME}}_session_secret_base64/$(echo -n "$session_secret" | base64)/g" \
        -e "s/{{SITE_NAME}}_jwt_secret_base64/$(echo -n "$jwt_secret" | base64)/g" \
        -e "s/{{OPENAI_API_KEY_BASE64}}/$(echo -n "${OPENAI_API_KEY:-}" | base64)/g" \
        -e "s/{{GOOGLE_API_KEY_BASE64}}/$(echo -n "${GOOGLE_API_KEY:-}" | base64)/g" \
        -e "s/{{STRIPE_SECRET_KEY_BASE64}}/$(echo -n "${STRIPE_SECRET_KEY:-}" | base64)/g" \
        -e "s/{{STRIPE_WEBHOOK_SECRET_BASE64}}/$(echo -n "${STRIPE_WEBHOOK_SECRET:-}" | base64)/g" \
        "$template_file" > "$output_file"
    
    print_success "Site configuration generated: $output_file"
    echo "$output_file"
}

# Function to deploy to Kubernetes
deploy_to_kubernetes() {
    local config_file="$1"
    
    print_status "Deploying to Kubernetes..."
    
    if [[ "$DRY_RUN" == true ]]; then
        print_warning "DRY RUN: Would apply configuration:"
        kubectl apply -f "$config_file" --dry-run=client
        return 0
    fi
    
    # Apply the configuration
    kubectl apply -f "$config_file"
    
    # Wait for deployment to be ready
    local namespace="$SITE_NAME-$NAMESPACE_SUFFIX"
    print_status "Waiting for deployment to be ready..."
    kubectl rollout status deployment/"$SITE_NAME"-app -n "$namespace" --timeout=300s
    
    print_success "Deployment completed successfully"
}

# Function to verify deployment
verify_deployment() {
    if [[ "$DRY_RUN" == true ]]; then
        print_warning "DRY RUN: Skipping deployment verification"
        return 0
    fi
    
    print_status "Verifying deployment..."
    
    local namespace="$SITE_NAME-$NAMESPACE_SUFFIX"
    local domain="$SITE_NAME.$DOMAIN_SUFFIX"
    
    # Check if pods are running
    local pod_status=$(kubectl get pods -n "$namespace" -l app=master-cms,site="$SITE_NAME" -o jsonpath='{.items[*].status.phase}')
    if [[ "$pod_status" != "Running Running" ]]; then
        print_error "Pods are not running: $pod_status"
        exit 1
    fi
    
    # Check if service is accessible
    local service_ip=$(kubectl get service "$SITE_NAME"-app -n "$namespace" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [[ -z "$service_ip" ]]; then
        print_warning "Service IP not available yet. This is normal for new deployments."
    else
        print_success "Service is accessible at: $service_ip"
    fi
    
    # Check if ingress is configured
    local ingress_status=$(kubectl get ingress "$SITE_NAME"-ingress -n "$namespace" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    if [[ -n "$ingress_status" ]]; then
        print_success "Ingress is configured: $ingress_status"
    fi
    
    # Test health endpoint (if domain is accessible)
    if nslookup "$domain" &> /dev/null; then
        print_status "Testing health endpoint..."
        if curl -f "https://$domain/api/health" &> /dev/null; then
            print_success "Health endpoint is responding"
        else
            print_warning "Health endpoint not responding yet (this is normal for new deployments)"
        fi
    fi
    
    print_success "Deployment verification completed"
}

# Function to cleanup temporary files
cleanup() {
    local config_file="$1"
    if [[ -f "$config_file" ]]; then
        rm -f "$config_file"
        print_status "Cleaned up temporary files"
    fi
}

# Function to display deployment summary
show_summary() {
    local domain="$SITE_NAME.$DOMAIN_SUFFIX"
    local namespace="$SITE_NAME-$NAMESPACE_SUFFIX"
    
    cat << EOF

${GREEN}=== Deployment Summary ===${NC}
Site Name:     $SITE_NAME
Environment:   $ENVIRONMENT
Domain:        $domain
Namespace:     $namespace
Status:        ${GREEN}SUCCESS${NC}

${BLUE}Next Steps:${NC}
1. Configure DNS for $domain to point to your ingress controller
2. Set up SSL certificates (handled automatically by cert-manager)
3. Configure monitoring and alerting
4. Set up backup and disaster recovery

${BLUE}Useful Commands:${NC}
- View logs: kubectl logs -f deployment/$SITE_NAME-app -n $namespace
- Check status: kubectl get all -n $namespace
- Access shell: kubectl exec -it deployment/$SITE_NAME-app -n $namespace -- /bin/sh
- View ingress: kubectl get ingress -n $namespace

EOF
}

# Main execution
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -s|--skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -k|--kubeconfig)
                KUBECONFIG="$2"
                export KUBECONFIG
                shift 2
                ;;
            --domain-suffix)
                DOMAIN_SUFFIX="$2"
                shift 2
                ;;
            -*)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                if [[ -z "$SITE_NAME" ]]; then
                    SITE_NAME="$1"
                elif [[ -z "$ENVIRONMENT" ]]; then
                    ENVIRONMENT="$1"
                else
                    print_error "Too many arguments"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Validate required arguments
    if [[ -z "$SITE_NAME" ]] || [[ -z "$ENVIRONMENT" ]]; then
        print_error "Site name and environment are required"
        show_usage
        exit 1
    fi
    
    # Validate inputs
    validate_site_name
    validate_environment
    
    # Set environment configuration
    set_environment_config
    
    # Check prerequisites
    check_prerequisites
    
    # Validate site configuration
    validate_site_config
    
    # Generate site configuration
    local config_file=$(generate_site_config)
    
    # Deploy to Kubernetes
    deploy_to_kubernetes "$config_file"
    
    # Verify deployment
    verify_deployment
    
    # Show summary
    show_summary
    
    # Cleanup
    cleanup "$config_file"
    
    print_success "Site deployment completed successfully!"
}

# Trap to cleanup on exit
trap 'cleanup "$config_file" 2>/dev/null' EXIT

# Run main function
main "$@" 