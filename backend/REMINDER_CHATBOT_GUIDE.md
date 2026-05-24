# Reminder Chatbot API Documentation

## Overview
The Reminder Chatbot system provides both structured and natural language interfaces for managing reminders. Users can create, manage, and track reminders through traditional API calls or conversational interactions.

---

## Core Features

### 1. **Reminder Management**
- Create, read, update, and delete reminders
- Support for recurring reminders (daily, weekly, monthly, yearly)
- Multiple reminder categories and priority levels
- Tag-based organization

### 2. **Chatbot Interface**
- Natural language reminder creation
- Parse conversational messages into structured reminders
- Supports various date formats and relative dates

### 3. **Smart Reminder Features**
- Status tracking: pending, completed, overdue, cancelled
- Automatic overdue detection
- Category classification: personal, work, health, shopping, finance, other
- Priority levels: low, medium, high
- Search and filter by multiple criteria

---

## API Endpoints

### Reminder CRUD Operations

#### Get All Reminders
```
GET /api/reminders/
```
**Query Parameters:**
- `limit` (default: 20) - Number of reminders to return
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-id",
      "title": "Buy milk",
      "description": "Get organic milk from store",
      "dueDate": "2026-05-25",
      "dueTime": "15:30",
      "status": "pending",
      "category": "shopping",
      "priority": "medium",
      "isRecurring": false,
      "recurrenceType": "none",
      "tags": ["groceries"],
      "notificationSent": false,
      "createdAt": "2026-05-24T10:00:00Z",
      "updatedAt": "2026-05-24T10:00:00Z"
    }
  ]
}
```

#### Get Reminder by ID
```
GET /api/reminders/{reminderId}
```

#### Create Reminder (Structured)
```
POST /api/reminders/
Content-Type: application/json

{
  "title": "Team meeting",
  "description": "Quarterly review meeting",
  "dueDate": "2026-05-25",
  "dueTime": "14:00",
  "category": "work",
  "priority": "high",
  "isRecurring": true,
  "recurrenceType": "weekly",
  "recurrenceEndDate": "2026-08-25",
  "tags": ["work", "meeting"]
}
```

#### Update Reminder
```
PATCH /api/reminders/{reminderId}
Content-Type: application/json

{
  "status": "completed",
  "priority": "low"
}
```

#### Delete Reminder
```
DELETE /api/reminders/{reminderId}
```

---

### Chatbot Interface

#### Create Reminder via Natural Language
```
POST /api/reminders/chatbot/create
Content-Type: application/json

{
  "message": "Remind me to buy milk tomorrow at 3pm"
}
```

**Supported Patterns:**
- "Remind me to [task] tomorrow"
- "Remind me to [task] tomorrow at [time]"
- "Remind me to [task] next Monday"
- "Remind me to [task] next week at [time]"
- "[task] today"

**Priority Keywords:**
- High: "urgent", "asap", "immediately", "important", "critical"
- Low: "low priority", "whenever", "not urgent"
- Medium: (default)

**Category Auto-Detection:**
- Shopping: "buy", "purchase", "shopping", "shop"
- Work: "work", "meeting", "call", "presentation", "project"
- Health: "doctor", "hospital", "medicine", "health", "exercise", "gym"
- Finance: "pay", "bill", "invoice", "budget", "finance", "tax"

**Examples:**
```bash
# Simple reminder
POST /api/reminders/chatbot/create
{ "message": "Remind me to call mom tomorrow" }

# With time
POST /api/reminders/chatbot/create
{ "message": "Doctor appointment next Monday at 10am" }

# With priority
POST /api/reminders/chatbot/create
{ "message": "Urgent: Submit project report by Friday 5pm" }

# Recurring reminder
POST /api/reminders/chatbot/create
{ "message": "Buy groceries every Sunday morning" }
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Reminder created: \"Buy milk\" on 2026-05-25 at 15:30",
  "data": {
    "id": "uuid",
    "title": "Buy milk",
    "dueDate": "2026-05-25",
    "dueTime": "15:30",
    "category": "shopping",
    "priority": "medium",
    ...
  }
}
```

---

### Advanced Query Routes

#### Get Upcoming Reminders
```
GET /api/reminders/list/upcoming?days=7
```
Returns reminders due within the next N days (default: 7 days)

#### Get User Reminders
```
GET /api/reminders/list/user
```
Returns all reminders for authenticated user

#### Get Reminders by Status
```
GET /api/reminders/list/status/{status}
```
**Statuses:** `pending`, `completed`, `overdue`, `cancelled`

#### Get Reminders by Category
```
GET /api/reminders/list/category/{category}
```
**Categories:** `personal`, `work`, `health`, `shopping`, `finance`, `other`

#### Get Overdue Reminders
```
GET /api/reminders/list/overdue
```
Returns all overdue pending reminders

#### Get Reminders by Tag
```
GET /api/reminders/list/tags/{tag}
```

#### Get Reminder Statistics
```
GET /api/reminders/stats/summary
```
**Response:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "pending": 8,
    "completed": 5,
    "overdue": 2,
    "completionRate": 62
  }
}
```

#### Search Reminders
```
GET /api/reminders/search?q={searchTerm}
```
Searches in title and description fields

---

### Action Routes

#### Mark Reminder as Completed
```
PATCH /api/reminders/{reminderId}/complete
```

---

## Data Models

### Reminder Object
```typescript
interface Reminder {
  id: string;                    // UUID
  userId: string;                // User ID
  title: string;                 // Reminder title
  description: string;           // Detailed description
  dueDate: string;              // ISO date format (YYYY-MM-DD)
  dueTime?: string;             // 24-hour format (HH:mm)
  status: ReminderStatus;        // pending | completed | overdue | cancelled
  category: ReminderCategory;    // personal | work | health | shopping | finance | other
  priority: "low" | "medium" | "high";
  isRecurring: boolean;          // If reminder repeats
  recurrenceType: RecurrenceType; // none | daily | weekly | monthly | yearly
  recurrenceEndDate?: string;    // When recurring reminder ends
  tags: string[];                // For organization
  notificationSent: boolean;     // Whether notification was sent
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

### Create/Update Payloads
```typescript
interface CreateReminderPayload {
  userId: string;
  title: string;                 // Required
  description?: string;
  dueDate: string;              // Required - ISO date
  dueTime?: string;
  category?: ReminderCategory;   // Default: 'other'
  priority?: "low" | "medium" | "high"; // Default: 'medium'
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: string;
  tags?: string[];
}
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

---

## Chatbot Examples

### Example 1: Simple Task
```
User Input: "Remind me to call John tomorrow"
Parsed:
  - title: "call John"
  - dueDate: tomorrow's date
  - category: "personal" (default)
  - priority: "medium"
```

### Example 2: Work Task with Time
```
User Input: "Meeting with client next Monday at 2:30pm"
Parsed:
  - title: "Meeting with client"
  - dueDate: next Monday's date
  - dueTime: "14:30"
  - category: "work" (auto-detected)
  - priority: "medium"
```

### Example 3: Urgent Purchase
```
User Input: "URGENT! Buy birthday cake by Friday 6pm"
Parsed:
  - title: "Buy birthday cake"
  - dueDate: Friday's date
  - dueTime: "18:00"
  - category: "shopping" (auto-detected)
  - priority: "high" (detected from "URGENT")
```

---

## Integration Example

```javascript
// Create reminder via chatbot
const response = await fetch('/api/reminders/chatbot/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Remind me to prepare presentation for tomorrow 10am'
  })
});

const { data, message } = await response.json();
console.log(message); // "✅ Reminder created: ..."

// Get upcoming reminders
const upcomingResponse = await fetch('/api/reminders/list/upcoming?days=14');
const { data: upcoming } = await upcomingResponse.json();

// Mark as completed
await fetch(`/api/reminders/${reminderId}/complete`, {
  method: 'PATCH'
});
```

---

## Best Practices

1. **Use Chatbot for Quick Creation** - The chatbot interface is best for rapid reminder creation during conversation
2. **Use Structured API for Complex Reminders** - For detailed descriptions and recurring patterns
3. **Check Overdue Regularly** - Monitor `/api/reminders/list/overdue` for tracking
4. **Use Tags** - Tag reminders for better organization and filtering
5. **Set Categories** - Helps with auto-detection and filtering
6. **Use Priority Levels** - For filtering important vs. routine tasks

---

## Future Enhancements

- [ ] Recurring reminder frequency customization
- [ ] Reminder notifications (email, SMS, push)
- [ ] Sharing reminders with other users
- [ ] AI-powered task suggestions
- [ ] Mobile app integration
- [ ] Voice command support
- [ ] Calendar integration
- [ ] Reminder templates
