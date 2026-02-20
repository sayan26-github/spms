Backend Engineering & Architecture Prompt
AI-Driven Student Performance Monitoring System (SPMS)
🎯 Purpose

This document provides a comprehensive engineering checklist and architectural guidance for building the Django backend of the AI-Driven Student Performance Monitoring System.

The goal is to ensure:

Clean modular architecture

Multi-tenant safety

Proper RBAC enforcement

Database integrity

Scalable foundation

No technical debt

📁 1. Folder Structure & Modular Organization
✅ Required Django Structure
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
├── manage.py
└── venv/

Rules:

[ ] No business logic in views
[ ] Service layer mandatory (services.py in each app)
[ ] Permission classes separated
[ ] Models grouped by domain
[ ] No deep nested folder structures
[ ] Clear naming conventions

🔐 2. Authentication & Multi-Tenant Security
Required User Design (As per Project Overview 

SPMP overview

)

registration_number (fixed length)

DOB as initial password

must_change_password flag

forget password with OTP (future)

Required Model Structure

Custom User (AbstractBaseUser):

[ ] college (ForeignKey)
[ ] registration_number
[ ] role (STUDENT, TEACHER, ADMIN, HEAD)
[ ] must_change_password
[ ] is_active
[ ] is_staff

Database Constraints

[ ] UniqueConstraint(college, registration_number)
[ ] Index on registration_number
[ ] Role-based filtering

Anti-Patterns

[ ] Using default Django User
[ ] Allowing cross-college queries
[ ] Storing raw DOB password
[ ] No password hashing

🏛️ 3. Academic Structure Module

Reflecting Indian college system (8 semesters, fixed registration ID) 

SPMP overview

Models Required:

[ ] College
[ ] Student (OneToOne User)
[ ] Teacher (OneToOne User)
[ ] Subject (semester-specific)
[ ] Enrollment

Constraints:

[ ] One subject → exactly one teacher
[ ] Unique(student, subject)
[ ] Semester stored as integer (1–8)
[ ] Index on semester

Anti-Patterns:

[ ] Allowing student subject drop mid-semester
[ ] No foreign key constraints
[ ] Storing semester redundantly in multiple tables

📅 4. Attendance Engine (Core Logic)

Based on offline class upload model 

SPMP overview

Models:

ClassSession
[ ] subject
[ ] date
[ ] created_by
[ ] Unique(subject, date)

Attendance
[ ] class_session
[ ] student
[ ] status (PRESENT / ABSENT)
[ ] Unique(class_session, student)

Logic Rules:

[ ] Auto-create attendance rows
[ ] transaction.atomic for session creation
[ ] Prevent duplicate sessions
[ ] Weighted semester aggregation

Anti-Patterns:

[ ] Storing attendance percentage in DB
[ ] Calculating totals in frontend
[ ] No atomic transaction

📝 5. Assessment & Internal Tests

Reflecting 4 internal tests per semester 

SPMP overview

Models:

[ ] AssessmentType
[ ] Assessment
[ ] Marks

Constraints:

[ ] Unique(assessment, student)
[ ] max_marks validation
[ ] Enrollment validation before mark upload
[ ] Atomic bulk mark insertion

Anti-Patterns:

[ ] No validation on marks > max_marks
[ ] Allowing duplicate mark entries
[ ] Business validation inside serializers only

🤖 6. AI & Data Intelligence Layer

As defined in your document 

SPMP overview

Requirements:

[ ] Prediction table
[ ] Linear Regression (MVP)
[ ] Risk classification (LOW/MEDIUM/HIGH)
[ ] Separate ml_engine.py
[ ] No heavy ML in views

Early Warning System:

[ ] Attendance threshold detection
[ ] Declining internal trend detection

Anti-Patterns:

[ ] Training model inside API call
[ ] Running heavy Pandas ops synchronously in request cycle

💬 7. Communication Hub

Models:

[ ] Message
[ ] Notification

Rules:

[ ] Role-restricted messaging
[ ] Pagination required
[ ] is_read flag
[ ] College isolation

Anti-Patterns:

[ ] No filtering by college
[ ] No role validation

⚙️ 8. API Design Standards

All endpoints must use:

/api/v1/


Rules:

[ ] Proper HTTP status codes
[ ] Structured error responses
[ ] No raw DB exceptions exposed
[ ] Use DRF ViewSets where appropriate
[ ] Separate serializers for read/write

🧪 9. Testing Standards

Testing Pyramid (Backend Focus)

[ ] Unit tests for services
[ ] Permission tests
[ ] Attendance aggregation tests
[ ] Marks upload tests
[ ] Prediction output validation

Minimum coverage target: 70%

🚀 10. Performance & Optimization

Database:

[ ] Index on college_id
[ ] Composite index (subject, date)
[ ] select_related for FK-heavy queries
[ ] prefetch_related for M2M

Avoid:

[ ] N+1 query problems
[ ] Large unpaginated lists
[ ] Redundant DB hits

📊 11. Code Quality Metrics

Maintainability Targets:

[ ] Function length < 50 lines
[ ] Cyclomatic complexity < 10
[ ] No duplicated business logic
[ ] Clear service layer separation
[ ] No god-files

🛡️ 12. Deployment Readiness

[ ] DEBUG = False in production
[ ] Environment variables via .env
[ ] Secure secret key storage
[ ] Gunicorn configuration
[ ] Logging configured