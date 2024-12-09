# Serverless Chatroom Infrastructure

## Architecture Overview
![Architecture Diagram](ArchitectureDiagramv4.png)

This repository provides a complete serverless chatroom application infrastructure using AWS services. It includes all necessary infrastructure-as-code templates and implementation code for immediate deployment. The architecture diagram above illustrates how the various AWS services interact to deliver a scalable, real-time chat solution.

Our implementation leverages several AWS services:
- Amazon Cognito manages user authentication and authorization
- API Gateway provides both REST and WebSocket endpoints
- AWS Lambda functions process authentication and message handling
- Amazon DynamoDB stores chat messages and connection information
- Amazon S3 hosts the static website content

## WebSocket Integration
![Web Socket API Documentation](WebSocketAPI.png)

The WebSocket API implementation enables real-time communication through:
- Persistent connections for immediate message delivery
- Efficient broadcast capabilities to connected clients
- Connection management through DynamoDB
- Secure message routing and delivery

## Repository Contents

```
chatroom-infrastructure/
├── cloudformation/
│   └── template.yaml       # CloudFormation infrastructure template
├── lambda/
│   ├── token-exchange/    # Token exchange function implementation
│   │   ├── index.js       # Main function code
│   │   └── package.json   # Dependencies
│   ├── get-messages/      # Message retrieval function
│   │   └── index.py       # Message handling implementation
│   ├── store-message/     # Message storage function
│   │   └── index.py       # Storage implementation
│   └── websocket/         # WebSocket connection handlers
│       ├── connect.js     # Connection management
│       ├── disconnect.js  # Disconnection handling
│       └── message.js     # Message broadcasting
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

## Deployment Process

### 1. Infrastructure Deployment

The CloudFormation template creates all required AWS resources, including the website hosting infrastructure:

```bash
aws cloudformation create-stack \
  --stack-name chatroom-app \
  --template-body file://cloudformation/template.yaml \
  --capabilities CAPABILITY_IAM \
  --parameters ParameterKey=DomainName,ParameterValue=your-domain.com
```

The template automatically provisions:
- Cognito User Pool for authentication
- API Gateway endpoints for REST and WebSocket APIs
- DynamoDB tables for message and connection storage
- S3 bucket configured for website hosting
- Lambda functions for application logic
- Required IAM roles and policies

### 2. Lambda Function Configuration

The Lambda functions are provided in the repository and are automatically deployed by CloudFormation. No additional packaging or uploading is required. The functions include:

- Token Exchange: Handles authentication token management
- Message Management: Processes message storage and retrieval
- WebSocket Handlers: Manages real-time connections and message broadcasting

## Configuration Details

After deployment, CloudFormation provides important configuration values through stack outputs:

- Cognito User Pool ID for authentication
- API Gateway endpoints for REST and WebSocket connections
- S3 website URL for application access
- Lambda function configurations

## Implementation Features

The included Lambda functions provide:

- Secure token exchange with Cognito integration
- Message persistence in DynamoDB
- Real-time message broadcasting via WebSocket
- Connection state management
- Error handling and logging

## Security Implementation

The application implements several security measures:

- Token-based authentication using Cognito
- Secure WebSocket connections
- CORS configuration for API endpoints
- Encrypted data storage
- Least-privilege IAM roles
- HTTPS enforcement for S3 website access
