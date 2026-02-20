We are building the backend for an AI-Driven Student Performance Monitoring System (SPMS).

Tech Stack:
- Django 4+
- Django REST Framework
- PostgreSQL
- SimpleJWT for authentication
- Windows development environment
- Modular architecture
- Multi-tenant (college-based data isolation)

We are starting completely from scratch.

Before generating code, first explain the architectural plan clearly.

Then generate code step-by-step (NOT entire project at once) for:

1. Proper Django modular structure:
   - config (project)
   - apps folder
   - users app
   - academics app
   - attendance app
   - assessments app
   - analytics app
   - communication app
   - common app

2. Custom User model using AbstractBaseUser:
   Required fields:
   - college (ForeignKey)
   - registration_number (unique per college)
   - role (STUDENT, TEACHER, ADMIN, HEAD)
   - email
   - phone
   - must_change_password (Boolean)
   - is_active
   - is_staff
   - created_at

3. Custom UserManager implementation.

4. College model.

5. Proper Meta constraints:
   - UniqueConstraint (college, registration_number)

6. Configure:
   - AUTH_USER_MODEL
   - PostgreSQL database settings
   - JWT authentication using SimpleJWT
   - INSTALLED_APPS structure

7. Create base permission classes inside users/permissions.py:
   - IsStudent
   - IsTeacher
   - IsAdmin
   - IsHead

Rules:
- Do NOT generate attendance or assessment logic yet.
- Do NOT generate frontend.
- Do NOT generate entire backend at once.
- Generate foundation files only.
- Use service-layer architecture (even if empty for now).
- Add clear comments explaining decisions.
- Ensure multi-tenant safety via college-based isolation.

After code generation, provide:
- List of files created
- Migration instructions
- Testing instructions
