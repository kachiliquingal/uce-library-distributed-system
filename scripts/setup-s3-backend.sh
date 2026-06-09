#!/bin/bash
# Script to auto-provision the Terraform S3 backend bucket.
# Uses the TF_STATE_BUCKET env variable set by the workflow.
# If not set, falls back to a name based on the AWS Account ID.

REGION="us-east-1"

# Use the bucket name from the workflow environment if available
if [ -z "$TF_STATE_BUCKET" ]; then
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  BUCKET_NAME="uce-tf-state-${AWS_ACCOUNT_ID}"
  echo "TF_STATE_BUCKET=$BUCKET_NAME" >> $GITHUB_ENV
else
  BUCKET_NAME="$TF_STATE_BUCKET"
fi

echo "Verifying Terraform state bucket: $BUCKET_NAME"

if ! aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "Bucket does not exist. Creating $BUCKET_NAME..."
  aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"

  # Enable versioning for state file safety
  aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled
  echo "Versioning enabled on bucket $BUCKET_NAME."
else
  echo "Bucket $BUCKET_NAME is already provisioned and ready."
fi