# Serverless Chatroom Infrastructure

This repository provides a complete serverless chatroom application infrastructure using AWS services. It includes all necessary infrastructure-as-code templates and implementation code for immediate deployment. The architecture diagram above illustrates how the various AWS services interact to deliver a scalable, real-time chat solution.

Our implementation leverages several AWS services:
- Amazon Cognito manages user authentication and authorization
- API Gateway provides both REST and WebSocket endpoints
- AWS Lambda functions process authentication and message handling
- Amazon DynamoDB stores chat messages and connection information
- Amazon S3 hosts the static website content

# Architecture Diagram
![Architecture Diagram](ArchitectureDiagramv4.png)

# Architecture Flowchart
![Architecture Diagram](chatroomArchitectureDiagramv3.gif)

## WebSocket Integration
![Web Socket API Documentation](WebSocketAPI.png)

The WebSocket API implementation enables real-time communication through:
- Persistent connections for immediate message delivery
- Efficient broadcast capabilities to connected clients
- Session management through DynamoDB
- Secure message routing and delivery

## Repository Contents

```
chatroom-infrastructure/
├── cloudformation/
│   └── template.yaml       # CloudFormation infrastructure template
├── lambda/
│   ├── getChatMessages/      # Message retrieval function
│   ├── store-message/     # Message storage function
├── website/               # Static website files
│   ├── index.html        # Main application page
│   ├── css/              # Styling
│   └── js/               # Frontend implementation
└── README.md
```

## Prerequisites

The deployment process requires:
- An AWS Account with administrator access
- AWS CLI installed and configured
- A domain name for the application (optional)

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chatroom-infrastructure
   ```

2. Install dependencies:
   ```bash
   # Install AWS CLI if not already installed
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Configure AWS CLI
   aws configure
   ```

## Deployment

1. Deploy AWS infrastructure:
   ```bash
   aws cloudformation create-stack \
     --stack-name chatroom-app \
     --template-body file://cloudformation/template.yaml \
     --capabilities CAPABILITY_IAM
   ```

2. Get stack outputs and configure application:
   ```bash
   # Get CloudFormation outputs
   aws cloudformation describe-stacks \
     --stack-name chatroom-app \
     --query 'Stacks[0].Outputs' \
     --output json > stack-outputs.json
   ```

3. Update the frontend main.js with CloudFormation outputs:
   ```bash
   # Get required values
   USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name chatroom-app --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
   CLIENT_ID=$(aws cloudformation describe-stacks --stack-name chatroom-app --query 'Stacks[0].Outputs[?OutputKey==`ClientId`].OutputValue' --output text)
   COGNITO_DOMAIN=$(aws cloudformation describe-stacks --stack-name chatroom-app --query 'Stacks[0].Outputs[?OutputKey==`UserPoolDomainName`].OutputValue' --output text)
   API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name chatroom-app --query 'Stacks[0].Outputs[?OutputKey==`WebApiEndpoint`].OutputValue' --output text)
   
   # Replace placeholders in main.js
   sed -i "s|YOUR_USER_POOL_ID|$USER_POOL_ID|g" website/js/main.js
   sed -i "s|YOUR_CLIENT_ID|$CLIENT_ID|g" website/js/main.js
   sed -i "s|YOUR_COGNITO_DOMAIN|$COGNITO_DOMAIN|g" website/js/main.js
   sed -i "s|YOUR_STORE_MESSAGE_ENDPOINT|$API_ENDPOINT/messages|g" website/js/main.js
   sed -i "s|YOUR_GET_MESSAGES_ENDPOINT|$API_ENDPOINT/messages|g" website/js/main.js
   ```

4. Update Lambda functions with environment variables:
   ```bash
   # Get website domain
   WEBSITE_URL=$(aws cloudformation describe-stacks --stack-name chatroom-app --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' --output text)
   TABLE_NAME=$(aws cloudformation describe-stacks --stack-name chatroom-app --query 'Stacks[0].Outputs[?OutputKey==`MessagesTableName`].OutputValue' --output text)
   
   # Update Lambda functions
   aws lambda update-function-configuration \
     --function-name chatroom-app-getChatMessages \
     --environment "Variables={ALLOWED_ORIGIN=$WEBSITE_URL,TABLE_NAME=$TABLE_NAME}"
   
   aws lambda update-function-configuration \
     --function-name chatroom-app-storeMessage \
     --environment "Variables={ALLOWED_ORIGIN=$WEBSITE_URL,TABLE_NAME=$TABLE_NAME}"
   ```

5. Deploy Lambda functions:
   ```bash
   cd lambda
   zip -r ../getChatMessages.zip getChatMessages/
   zip -r ../store-message.zip store-message/
   
   aws s3 cp getChatMessages.zip s3://your-lambda-bucket/
   aws s3 cp store-message.zip s3://your-lambda-bucket/
   ```

6. Deploy frontend:
   ```bash
   cd website
   aws s3 sync . s3://your-bucket-name/
   ```

## Testing

1. Get your deployed website URL:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name chatroom-app \
     --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
     --output text
   ```

2. Open the URL in your browser
3. Create an account and test the chat functionality

## Cleanup

1. Empty S3 buckets:
   ```bash
   aws s3 rm s3://your-bucket-name --recursive
   aws s3 rm s3://your-lambda-bucket --recursive
   ```

2. Delete CloudFormation stack:
   ```bash
   aws cloudformation delete-stack --stack-name chatroom-app
   ```
