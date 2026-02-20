BACKEND DEEP ENGINEERING MASTER PROMPT
AI-Driven Student Performance Monitoring System (SPMS)
🧠 SYSTEM CONTEXT

You are building the backend for a production-grade academic intelligence platform.

Stack:

Django 4+

Django REST Framework

PostgreSQL

JWT Authentication (SimpleJWT)

Multi-tenant architecture (college_id based)

Modular app structure

Service-layer pattern

Strict RBAC

This system digitizes offline attendance and assessment records and generates predictive analytics.

You must generate production-quality backend code only.

🏗️ ARCHITECTURE REQUIREMENTS
Folder Structure (Mandatory)
backend/
├── config/
├── apps/
│   ├── users/
│   ├── academics/
│   ├── attendance/
│   ├── assessments/
│   ├── analytics/
│   ├── communication/
│   └── common/


Rules:

No business logic inside views.py

Heavy logic must go into services.py

Use serializers only for validation & transformation

Use permission classes inside users/permissions.py

Use custom manager where appropriate

Use Model-level constraints

Use database indexing

🔐 MULTI-TENANT RULES (NON-NEGOTIABLE)

Every core model must include:

college = ForeignKey(College, on_delete=models.CASCADE)


All querysets must filter by:

request.user.college


Never trust frontend role.

Enforce filtering at:

View level

Queryset level

Service layer

Add database constraints:

UniqueConstraint(fields=["college", "registration_number"])


Never allow cross-college data access.

👤 USER & RBAC REQUIREMENTS

Custom User Model using AbstractBaseUser.

Fields:

college (FK)

registration_number

role (STUDENT, TEACHER, ADMIN, HEAD)

email

phone

is_active

Implement:

Custom user manager

JWT authentication

Role-based permission classes:

IsStudent

IsTeacher

IsAdmin

IsHead

IsSameCollege

No logic duplication across apps.

📚 ACADEMIC STRUCTURE MODULE

Models Required:

Student (OneToOne → User)

Teacher (OneToOne → User)

Subject

semester

teacher (FK)

Unique (college, code, semester)

Enrollment

Unique (student, subject)

Rules:

One subject assigned to exactly one teacher

Student cannot drop subject mid-semester

Enrollment created by admin only

Add indexes on:

subject_id

student_id

college_id

📅 ATTENDANCE MODULE (CORE ENGINE)

Models:

ClassSession

subject (FK)

date

created_by (teacher)

UniqueConstraint(subject, date)

Attendance

class_session (FK)

student (FK)

status (PRESENT/ABSENT)

UniqueConstraint(class_session, student)

Logic Requirements:

When creating ClassSession:

Validate teacher owns subject

Block duplicate (subject, date)

Auto-create Attendance rows for all enrolled students

Default status = ABSENT

When marking attendance:

Only update PRESENT list

Keep DB integrity

Must be atomic transaction

Use:

@transaction.atomic


Aggregation logic:

Subject-wise attendance:

present_count / total_sessions


Semester total:
Weighted aggregation across subjects.

📝 ASSESSMENT MODULE

Models:

AssessmentType (configurable per college)

Assessment

Marks (Unique assessment + student)

Rules:

Teacher creates assessment

Teacher uploads marks

Validate student enrollment

Prevent duplicate marks

Use atomic transactions

Add indexes on:

assessment_id

student_id

🤖 ANALYTICS MODULE

Use:

Pandas

NumPy

Scikit-learn (LinearRegression)

Create:

analytics/ml_engine.py

Structure:

class PerformancePredictor:
    def train(self, dataset)
    def predict(self, input_data)
    def classify_risk(self, predicted_score)


Rules:

No ML logic in views

Store prediction results in Prediction table

Keep training lightweight (MVP)

Avoid heavy runtime computation inside API call

💬 COMMUNICATION MODULE

Models:

Message

Notification

Rules:

Filter by college

Filter by sender/receiver

Prevent unauthorized cross-user access

Use pagination.

🧱 SERVICE LAYER PATTERN

Every app must contain:

services.py


Example pattern:

attendance/services.py

class AttendanceService:
    @staticmethod
    def create_class_session(...)


Views should only:

Call service

Return response

No business logic inside views.

⚙️ API DESIGN STANDARDS

All endpoints must use:

/api/v1/


Use:

Proper status codes (201, 400, 403, 404)

Structured error responses

DRF ViewSets where appropriate

Serializer validation

Pagination for list endpoints

Never expose internal fields unnecessarily.

🧪 TESTING REQUIREMENTS

Write:

Unit tests for services

API tests for attendance creation

Aggregation validation test

Permission enforcement tests

Minimum coverage target: 70%

🚀 PERFORMANCE & INDEXING

Add indexes for:

college_id

subject_id

student_id

assessment_id

(subject_id, date)

Avoid N+1 queries:

Use:

select_related()
prefetch_related()

❌ ANTI-PATTERNS TO REJECT

Business logic inside serializers

Missing database constraints

No transaction.atomic

Direct object access without filtering by college

Massive god-functions (>100 lines)

Repeated role-checking logic

Hardcoded constants

🧩 CODE QUALITY RULES

Functions < 50 lines

Complexity < 10

Proper docstrings

No duplicate logic

Use constants file for enums

Strict PEP8 compliance

🛡️ PRODUCTION READINESS

Use environment variables

No DEBUG=True in production

Proper logging configuration

Secure password hashing

CSRF & CORS properly configured

🔥 FINAL INSTRUCTION TO AI (CRITICAL)

Before generating code:

Explain architecture decision

Show model definitions

Add constraints explicitly

Separate services

Add permission classes

Show example API usage

Generate module by module — not entire project at once.