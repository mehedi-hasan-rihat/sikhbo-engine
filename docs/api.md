# API Contract — Sikhbo Engine

**Base URL**: `/api/v1`
**Auth**: Bearer Token — `Authorization: Bearer <jwt_token>`
**Content-Type**: `application/json`

---

## Global Response Envelope

All responses follow a consistent shape.

**Success:**
```json
{
  "success": true,
  "message": "Descriptive message",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": { "field": "issue description" }
}
```

---

## Global Status Codes

| Code | Meaning |
|---|---|
| `400` | Bad Request — validation failed, field-level errors returned |
| `401` | Unauthorized — token missing, invalid, or expired |
| `403` | Forbidden — authenticated but insufficient role |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — duplicate resource (e.g. second submission) |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error — unexpected failure |

---

## Auth Routes

### POST `/auth/register`
Register a new student account.

**Access**: Public

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Validation:**
- `name` — required
- `email` — required, valid email format, unique
- `password` — required, minimum 6 characters

**Responses:**

`201 Created`
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGci..."
  }
}
```

`400 Bad Request`
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": "Invalid email format" }
}
```

`409 Conflict`
```json
{
  "success": false,
  "message": "Email already in use"
}
```

---

### POST `/auth/login`
Authenticate an existing user (Student or Mentor).

**Access**: Public

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Responses:**

`200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGci..."
  }
}
```

`400 Bad Request`
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": "Invalid email format" }
}
```

`401 Unauthorized`
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Submission Routes — Student

### POST `/submissions`
Submit a project. One submission per student only.

**Access**: `STUDENT` only
**Rate Limit**: 5 requests / 15 minutes per IP

**Request Body:**
```json
{
  "projectName": "string",
  "repoUrl": "string",
  "liveUrl": "string",
  "description": "string"
}
```

**Validation:**
- `projectName` — required, 3–100 chars
- `repoUrl` — required, valid URL, must be `github.com` domain
- `liveUrl` — optional, valid URL if provided
- `description` — required, 20–500 chars

**Responses:**

`201 Created`
```json
{
  "success": true,
  "message": "Project submitted successfully",
  "data": {
    "id": "uuid",
    "projectName": "Sikhbo Dashboard",
    "repoUrl": "https://github.com/mehedi/sikhbo-dashboard",
    "liveUrl": "https://sikhbo-dashboard.vercel.app",
    "description": "A full-stack project submission...",
    "status": "PENDING",
    "createdAt": "2026-10-21T11:55:45.570Z"
  }
}
```

`400 Bad Request`
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "repoUrl": "Repo URL must be a github.com URL" }
}
```

`401 Unauthorized`
```json
{
  "success": false,
  "message": "Authentication required"
}
```

`403 Forbidden`
```json
{
  "success": false,
  "message": "You do not have permission to access this resource"
}
```

`409 Conflict`
```json
{
  "success": false,
  "message": "You have already submitted this repository"
}
```

`429 Too Many Requests`
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

---

### GET `/submissions`
Get all submissions by the authenticated student.

**Access**: `STUDENT` only

**Responses:**

`200 OK`
```json
{
  "success": true,
  "message": "Submissions fetched successfully",
  "data": [
    {
      "id": "uuid",
      "projectName": "Sikhbo Dashboard",
      "repoUrl": "https://github.com/mehedi/sikhbo-dashboard",
      "liveUrl": "https://sikhbo-dashboard.vercel.app",
      "description": "A full-stack project submission...",
      "status": "PENDING",
      "createdAt": "2026-10-21T11:55:45.570Z"
    }
  ]
}
```

`401 Unauthorized`
```json
{
  "success": false,
  "message": "Authentication required"
}
```

`404 Not Found`
```json
{
  "success": false,
  "message": "You have not submitted a project yet"
}
```

---

## Submission Routes — Mentor

### GET `/mentor/submissions`
Get all submissions with pagination and optional status filter.

**Access**: `MENTOR` only

**Query Params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number |
| `pageSize` | `number` | `10` | Items per page |
| `status` | `string` | `ALL` | Filter: `ALL`, `PENDING`, `APPROVED`, `REJECTED` |
| `search` | `string` | — | Optional search by project name |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "uuid",
        "projectName": "string",
        "repoUrl": "string",
        "liveUrl": "string",
        "description": "string",
        "status": "PENDING",
        "createdAt": "ISO8601",
        "student": {
          "id": "uuid",
          "name": "string",
          "email": "string"
        }
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "pageSize": 10,
      "totalPages": 5
    }
  }
}
```

`401 Unauthorized`

`403 Forbidden`

---

### GET `/mentor/submissions/stats`
Get aggregated submission statistics.

**Access**: `MENTOR` only

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "total": 50,
    "pending": 30,
    "approved": 15,
    "rejected": 5
  }
}
```

`401 Unauthorized`

`403 Forbidden`

---

### PATCH `/mentor/submissions/:id/status`
Approve or reject a submission.

**Access**: `MENTOR` only

**Path Param:** `id` — submission UUID

**Request Body:**
```json
{
  "status": "APPROVED | REJECTED"
}
```

**Responses:**

`200 OK`
```json
{
  "success": true,
  "message": "Submission status updated",
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "updatedAt": "ISO8601"
  }
}
```

`400 Bad Request` — invalid status value

`401 Unauthorized`

`403 Forbidden`

`404 Not Found` — submission ID does not exist
