# Overview

![Architecture Diagram](ArchitectureDiagramv4.png)

# AWS Chatroom with Dynamodb, apigateway, lambda, s3, cognito, websocket

A serverless chat application built using various AWS services demonstrating cloud architecture and infrastructure as code.

## Web Socket API Documentation

![Web Socket API Documentation](WebSocketAPI.png)

## Amazon Cognito Integration

This project uses **Amazon Cognito** for secure user authentication and management. Cognito handles user sign-up and sign-in, supporting email-based authentication and external providers like Google. After authentication, users receive JSON Web Tokens (JWTs) to interact with protected APIs. 

### Key Features:
- **User Management**: Handles user sign-up, sign-in, and account status.
- **Token-Based Authentication**: Issues ID, Access, and Refresh tokens for secure API access.
- **External Providers**: Integrates with Google for seamless user login.

For more details, refer to the [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/).
