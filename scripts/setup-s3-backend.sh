#!/bin/bash
# Script to auto-provision the Terraform bucket
# Use the AWS account ID to make the bucket name globally unique

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="uce-tf-state-${AWS_ACCOUNT_ID}"
REGION="us-east-1"

echo "Verificando el bucket de estado de Terraform: $BUCKET_NAME"

if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
  echo "El bucket no existe. Creando $BUCKET_NAME automáticamente..."
  aws s3 mb s3://$BUCKET_NAME --region $REGION
else
  echo "El bucket $BUCKET_NAME ya está aprovisionado y listo."
fi

# Export the bucket name so that GitHub Actions can use it in `terraform init`
echo "TF_STATE_BUCKET=$BUCKET_NAME" >> $GITHUB_ENV