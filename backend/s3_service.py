"""
AWS S3 Integration Service for Telco Churn ML Model
Handles uploading, downloading, and synchronizing churn_model.pkl with AWS S3.
AWS Project Team 07
"""

import os
import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Dict, Any, Optional

# Load environment variables from .env files
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DEFAULT_BUCKET = os.environ.get("AWS_S3_BUCKET", "telecom-churn-analytics-team07")
DEFAULT_KEY = "models/churn_model.pkl"

class S3Service:
    def __init__(self, bucket_name: str = DEFAULT_BUCKET, region_name: str = "us-east-1"):
        self.bucket_name = bucket_name
        self.region_name = os.environ.get("AWS_DEFAULT_REGION", region_name)
        self._s3_client = None

    @property
    def client(self):
        if self._s3_client is None:
            self._s3_client = boto3.client('s3', region_name=self.region_name)
        return self._s3_client

    def upload_model(self, local_path: str, key: str = DEFAULT_KEY, bucket: Optional[str] = None) -> Dict[str, Any]:
        """Uploads the local pickle model to AWS S3."""
        target_bucket = bucket or self.bucket_name
        if not os.path.exists(local_path):
            return {"success": False, "message": f"Local model file not found: {local_path}"}

        try:
            file_size = os.path.getsize(local_path)
            self.client.upload_file(
                Filename=local_path,
                Bucket=target_bucket,
                Key=key,
                ExtraArgs={"Metadata": {"project": "AWS_Project_Team_07", "model": "churn_pipeline"}}
            )
            return {
                "success": True,
                "message": f"Successfully uploaded {local_path} to s3://{target_bucket}/{key}",
                "s3_uri": f"s3://{target_bucket}/{key}",
                "bucket": target_bucket,
                "key": key,
                "size_bytes": file_size
            }
        except NoCredentialsError:
            return {
                "success": False,
                "message": "AWS Credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or run 'aws configure'.",
                "error_code": "NoCredentialsError"
            }
        except ClientError as e:
            return {
                "success": False,
                "message": f"AWS S3 Client Error: {e.response['Error']['Message']}",
                "error_code": e.response['Error']['Code']
            }
        except Exception as e:
            return {"success": False, "message": f"Unexpected error uploading to S3: {str(e)}"}

    def download_model(self, local_path: str, key: str = DEFAULT_KEY, bucket: Optional[str] = None) -> Dict[str, Any]:
        """Downloads the pickle model from AWS S3."""
        target_bucket = bucket or self.bucket_name
        try:
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            self.client.download_file(
                Bucket=target_bucket,
                Key=key,
                Filename=local_path
            )
            return {
                "success": True,
                "message": f"Downloaded s3://{target_bucket}/{key} to {local_path}",
                "s3_uri": f"s3://{target_bucket}/{key}",
                "local_path": local_path,
                "size_bytes": os.path.getsize(local_path)
            }
        except NoCredentialsError:
            return {
                "success": False,
                "message": "AWS credentials not configured. Using local fallback pickle model.",
                "error_code": "NoCredentialsError"
            }
        except ClientError as e:
            return {
                "success": False,
                "message": f"AWS S3 Error: {e.response['Error']['Message']}",
                "error_code": e.response['Error']['Code']
            }
        except Exception as e:
            return {"success": False, "message": f"Unexpected error downloading from S3: {str(e)}"}

    def get_status(self, key: str = DEFAULT_KEY, bucket: Optional[str] = None) -> Dict[str, Any]:
        """Checks if model exists in S3 and returns metadata."""
        target_bucket = bucket or self.bucket_name
        try:
            res = self.client.head_object(Bucket=target_bucket, Key=key)
            return {
                "connected": True,
                "exists_in_s3": True,
                "bucket": target_bucket,
                "key": key,
                "s3_uri": f"s3://{target_bucket}/{key}",
                "size_bytes": res.get("ContentLength"),
                "size_mb": round(res.get("ContentLength", 0) / (1024 * 1024), 2),
                "last_modified": res.get("LastModified").isoformat() if res.get("LastModified") else None,
                "etag": res.get("ETag")
            }
        except NoCredentialsError:
            return {
                "connected": False,
                "exists_in_s3": False,
                "bucket": target_bucket,
                "key": key,
                "s3_uri": f"s3://{target_bucket}/{key}",
                "error": "AWS credentials not configured on local host."
            }
        except ClientError as e:
            code = e.response['Error']['Code']
            return {
                "connected": True if code == '404' else False,
                "exists_in_s3": False,
                "bucket": target_bucket,
                "key": key,
                "s3_uri": f"s3://{target_bucket}/{key}",
                "error": e.response['Error']['Message']
            }
        except Exception as e:
            return {
                "connected": False,
                "exists_in_s3": False,
                "bucket": target_bucket,
                "key": key,
                "s3_uri": f"s3://{target_bucket}/{key}",
                "error": str(e)
            }

s3_service = S3Service()
