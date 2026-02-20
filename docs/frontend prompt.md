FRONTEND DEEP ARCHITECTURE MASTER PROMPT
AI-Driven Student Performance Monitoring System (SPMS)
🧠 SYSTEM CONTEXT

You are building the frontend for a production-grade academic intelligence platform.

Stack:

React (Vite preferred)

React Router

Axios

Chart.js or Recharts

Tailwind CSS (or single consistent styling method)

JWT authentication

Polling-based notifications

This is a data-driven system, not just a UI showcase.

Backend is Django REST with /api/v1/.

The frontend must:

Consume stable APIs

Enforce role-based rendering

Remain scalable

Avoid tight coupling

📁 REQUIRED FOLDER STRUCTURE

Use this exact structure:

frontend/
│
├── src/
│   │
│   ├── api/                # Axios instances
│   │   ├── axios.js
│   │   └── endpoints.js
│   │
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── AuthContext.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── dashboard/
│   │   ├── StudentDashboard.jsx
│   │   ├── TeacherDashboard.jsx
│   │   └── AdminDashboard.jsx
│   │
│   ├── attendance/
│   │   ├── AttendancePage.jsx
│   │   ├── MarkAttendance.jsx
│   │   └── AttendanceTable.jsx
│   │
│   ├── assessments/
│   │   ├── AssessmentsPage.jsx
│   │   ├── UploadMarks.jsx
│   │
│   ├── analytics/
│   │   ├── PredictionPage.jsx
│   │   └── Charts.jsx
│   │
│   ├── communication/
│   │   ├── MessagesPage.jsx
│   │   └── Notifications.jsx
│   │
│   ├── components/         # Reusable UI components
│   ├── layouts/
│   ├── routes/
│   └── App.jsx
│
└── package.json



Rules:

No API calls inside UI components directly.

No business logic inside JSX.

Use custom hooks for data fetching.

Separate presentation and logic.

🔐 AUTHENTICATION & ROLE CONTROL

Use:

AuthContext for global auth state

JWT stored securely (not localStorage if possible; fallback if needed)

Axios interceptor to attach token

ProtectedRoute wrapper

Role-based route logic:

/student/*
/teacher/*
/admin/*


UI must render only permitted navigation links.

Never rely only on frontend for security — backend enforces.

🔄 API LAYER DESIGN

Inside src/api/:

Create:

axiosInstance.js
endpoints.js


Inside services/:

Create domain services:

attendanceService.js

assessmentService.js

analyticsService.js

messageService.js

Example pattern:

export async function fetchAttendanceSummary() {
  return axios.get("/attendance/my-summary/");
}


Never call axios directly inside components.

📊 DASHBOARD ARCHITECTURE

Separate dashboards per role:

dashboard/student/StudentDashboard.jsx
dashboard/teacher/TeacherDashboard.jsx
dashboard/admin/AdminDashboard.jsx


Each dashboard:

Fetches data via service layer

Uses reusable chart components

Avoids duplicate logic

Use loading and error states properly.

📅 ATTENDANCE UI REQUIREMENTS

Teacher View:

Create session form

Mark attendance grid

Prevent duplicate date UI-side validation

Clear success/error feedback

Student View:

Subject-wise attendance table

Semester total card

Visual percentage bar

Aggregation should not be calculated in frontend.
Use backend values.

📝 ASSESSMENT UI REQUIREMENTS

Teacher:

Create assessment form

Upload marks table (bulk input)

Validation on marks > max_marks

Student:

Marks table

Subject filter

Basic performance visualization

🤖 ANALYTICS UI REQUIREMENTS

Student:

Predicted score card

Risk badge

Attendance vs performance chart

Teacher:

At-risk student list

Risk color coding

Sort & filter

Do not compute ML logic in frontend.
Only display backend results.

💬 COMMUNICATION UI REQUIREMENTS

Polling-based messaging.

Implementation:

useEffect with setInterval (cleaned on unmount)

Notification badge

Message thread UI

Clear intervals on component unmount.

🧩 COMPONENT DESIGN STANDARDS

All reusable UI components go in:

components/ui/


Examples:

Button

Card

Table

Modal

Badge

Input

Rules:

Accept props for customization

No hardcoded text

No hardcoded styles

Support children where appropriate

🎨 STYLING STANDARDS

Choose ONE:

Tailwind

CSS Modules

Styled Components

Do not mix styling systems.

Rules:

Mobile-first design

No inline styles except dynamic

No !important

Use design tokens / variables

📱 RESPONSIVE DESIGN RULES

Mobile-first approach.

Breakpoints:

sm
md
lg
xl


Ensure:

No horizontal scrolling

Touch-friendly buttons

Readable typography

Flexible layouts (Flex/Grid)

⚡ PERFORMANCE RULES

Use React.memo where necessary

Use useMemo for derived values

Avoid unnecessary state

Avoid prop drilling (>3 levels)

Use context appropriately

Clean up intervals in useEffect

Avoid large JSON storage in state

🧠 STATE MANAGEMENT RULES

For MVP:

Local state + Context API

Avoid:

Premature Redux

Global state for everything

Separate:

UI state

Server state

Server state should ideally be fetched via custom hooks.

🧪 TESTING STANDARDS

Component unit tests (optional but recommended)

Critical flow test:

Login

Attendance marking

Marks viewing

Remove console.logs

Lint clean

❌ ANTI-PATTERNS TO REJECT

Direct axios calls inside JSX

Giant components (>300 lines)

Hardcoded roles in UI logic

State mutation

Missing dependency arrays in useEffect

Nested ternaries

Copy-paste components

🔥 PROMPT EXECUTION RULES 

Before generating code:

Explain structure

Show component tree

Create folder

Generate minimal viable component

Add service layer

Connect via API

Never generate entire frontend at once.

Generate module-by-module.