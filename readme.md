```markdown
# Telecom Billing System API

This is a RESTful API for managing telecom billing operations.

## Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
- [Authentication](#authentication)
- [Testing](#testing)

## Overview

This API provides endpoints for registering customers, generating invoices, buying plans, adding plans, and managing customer accounts. It uses Express.js as the web framework and Prisma for database operations.

## Endpoints

### Register User
- **Endpoint**: `/register`
- **Method**: POST
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```
- **Response**: 
```json
{
  "message": "User registered successfully.",
  "customerId": "customer1"
}
```

### Generate Invoice
- **Endpoint**: `/generateInvoice`
- **Method**: POST
- **Request Body**:
```json
{
  "customerId": "customer1",
  "amount": 100,
  "units": 50,
  "planId": "plan1"
}
```
- **Response**:
```json
{
  "message": "Invoice generated successfully.",
  "invoice": {
    "invoiceId": "inv001",
    "customerName": "John Doe",
    "customerId": "customer1",
    "planId": "plan1",
    "units": 50,
    "date": "2023-08-01",
    "amount": 100,
    "planType": "POSTPAID"
  }
}
```

### Buy Plan
- **Endpoint**: `/buyPlan`
- **Method**: POST
- **Request Body**:
```json
{
  "customerId": "customer1",
  "planName": "Premium Plan",
  "planType": "PREPAID"
}
```
- **Response**:
```json
{
  "customer": {
    "id": "customer1",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "hashed_password",
    "invoices": []
  },
  "plan": {
    "planId": "plan1",
    "planName": "Premium Plan",
    "ratePerUnit": 0.5,
    "prepaidPlans": [
      {
        "unitsAvailable": 500
      }
    ]
  },
  "invoice": {
    "invoiceId": "inv002",
    "customerName": "John Doe",
    "customerId": "customer1",
    "planId": "plan1",
    "units": 500,
    "date": "2023-08-01",
    "amount": 250,
    "planType": "PREPAID"
  }
}
```

### Add Plan
- **Endpoint**: `/admin/addPlan`
- **Method**: POST
- **Request Body**:
```json
{
  "planName": "Basic Plan Prepaid",
  "ratePerUnit": 0.5,
  "planType": "PREPAID",
  "prepaidBalance":0,
  "billingCycle": "Monthly"
}
```
- **Response**:
```json
{
  "plan": {
    "planId": 349039462,
    "planName": "Basic Plan Prepaid",
    "ratePerUnit": 0.5
  },
  "prepaidPlan": {
    "id": 1,
    "planId": 349039462,
    "unitsAvailable": 500,
    "prepaidBalance": 0
  }
}
```

### Add Customer
- **Endpoint**: `/admin/addCustomer`
- **Method**: POST
- **Request Body**:
```json
{
  "customerName": "Jane Smith",
  "customerMail": "jane@example.com",
  "customerPhone": "+1234567890"
}
```
- **Response**:
```json
{
  "id": 513679860,
  "name": "Jane Smith",
  "plan": 0,
  "mail": "jane@example.com",
  "phone": "+1234567890",
  "type": "N/A"
}
```

### Login
- **Endpoint**: `/login`
- **Method**: POST
- **Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```
- **Response**:
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customerId": "customer1",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Get Invoices
- **Endpoint**: `/invoices`
- **Method**: GET
- **Headers**: Include the JWT token from login
- **Response**:
```json
[
  {
    "invoiceId": "inv001",
    "amount": 100,
    "month": "August 2024",
    "service": "Pre-Paid",
    "paid": false,
    "dueDate": "2024-09-10"
  },
  {
    "invoiceId": "inv002",
    "amount": 250,
    "month": "September 2024",
    "service": "Post-Paid",
    "paid": false,
    "dueDate": "2024-10-10"
  }
]
```

### Pay Invoice
- **Endpoint**: `/payInvoice`
- **Method**: POST
- **Request Body**:
```json
{
  "invoiceId": "inv001"
}
```
- **Response**:
```json
{
  "message": "Invoice inv001 for customer customer1 has been paid.",
  "invoice": {
    "invoiceId": "inv001",
    "amount": 100,
    "month": "August 2024",
    "service": "Pre-Paid",
    "paid": true,
    "dueDate": "2024-09-10"
  }
}
```

## Authentication

All endpoints except `/register`, `/login`, and `/admin/addCustomer` require authentication using JWT tokens. Send the token in the `x-access-token` header of your requests.

## Testing

To test these APIs, you can use tools like Postman or cURL. Here's an example using cURL:

```bash
# Register User
curl -X POST http://localhost:9099/register \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","email":"john@example.com","password":"securePassword123"}'

# Login
curl -X POST http://localhost:9099/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john@example.com","password":"securePassword123"}'

# Generate Invoice (authenticated)
curl -X POST http://localhost:9099/generateInvoice \
     -H "Content-Type: application/json" \
     -H "x-access-token: YOUR_JWT_TOKEN" \
     -d '{"customerId":"customer1","amount":100,"units":50,"planId":"plan1"}'

# Get Invoices (authenticated)
curl -X GET http://localhost:9099/invoices \
     -H "x-access-token: YOUR_JWT_TOKEN"

# Pay Invoice (authenticated)
curl -X POST http://localhost:9099/payInvoice \
     -H "Content-Type: application/json" \
     -H "x-access-token: YOUR_JWT_TOKEN" \
     -d '{"invoiceId":"inv001"}'
```

Replace `YOUR_JWT_TOKEN` with the actual token obtained after logging in.

Remember to run the server before testing by executing `node index.js` in the terminal.
```

This README.md file provides a comprehensive overview of the Telecom Billing System API, including endpoint descriptions, request/response examples, and testing instructions. It covers all the main functionalities of the system, making it easy for developers to understand how to interact with the API and what kind of data they should expect in responses.