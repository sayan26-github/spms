---
trigger: always_on
---

🧠 1. ARCHITECTURE RULES (NON-NEGOTIABLE)

Always follow modular architecture.

No business logic inside views.

Use service layer (services.py) for core logic.

Use serializers only for validation and transformation.

Use permission classes for RBAC.

All database logic must respect multi-tenant isolation.

Never violate these.

🔐 2. MULTI-TENANT ISOLATION RULE

Every core model MUST include:

college = models.ForeignKey(College, on_delete=models.CASCADE)


Every queryset MUST filter by:

request.user.college


Never allow cross-college data access.

If code does not enforce this → it is incorrect.

👤 3. USER & AUTH RULES

Use custom User model only.

Never use Django default User.

Authentication must use JWT.

Role-based permission classes required:

IsStudent

IsTeacher

IsAdmin

IsHead

Never trust frontend role validation.

📦 4. DATABASE RULES

Use PostgreSQL.

Always define Meta constraints.

Use UniqueConstraint explicitly.

Add indexes for frequently queried fields.

Use transaction.atomic for critical writes.

Never duplicate fields across tables unnecessarily.

Follow normalization (3NF).

📅 5. ATTENDANCE RULES

ClassSession must be unique per (subject, date).

Attendance must be unique per (session, student).

Unmarked students default to ABSENT.

All attendance operations must be atomic.

Aggregation must be computed in backend only.

📝 6. ASSESSMENT RULES

Unique (assessment, student) for marks.

Validate student enrollment before inserting marks.

Use atomic bulk insert for marks.

Do not compute weighted totals in frontend.

🤖 7. ANALYTICS RULES

ML logic must live in analytics/ml_engine.py.

No ML logic inside views.

Store predictions in database.

Risk classification must be backend-driven.



💬 8. COMMUNICATION RULES

Filter all messages by college.

Filter sender/receiver strictly.

Use pagination for message lists.

Never expose private message IDs unnecessarily.

⚙️ 9. API DESIGN RULES

All endpoints must start with /api/v1/.

Use proper HTTP status codes.

Use DRF ViewSets where appropriate.

Return structured error responses.

Do not return raw database objects.

🎨 10. FRONTEND RULES

No API calls directly inside JSX.

Use service layer for API calls.

Separate UI from business logic.

Use role-based routing.

Do not compute backend aggregations in frontend.

Avoid prop drilling > 3 levels.

Clean up useEffect side effects.

🧪 11. TESTING RULES

Write unit tests for service layer.

Write API tests for attendance.

Test aggregation correctness.

Minimum 70% coverage target.

⚡ 12. PERFORMANCE RULES

Use select_related and prefetch_related.

Add indexes for:

college_id

student_id

subject_id

Avoid N+1 query problems.

No heavy computation in API request cycle.

❌ 13. ANTI-PATTERNS (STRICTLY FORBIDDEN)

Business logic in views

Hardcoded role checks

No multi-tenant filtering

Missing database constraints

Giant functions (>100 lines)

Duplicated code

Direct axios calls inside components

Mixing multiple styling systems

📦 14. CODE QUALITY RULES

Functions < 50 lines

Cyclomatic complexity < 10

Proper docstrings

PEP8 compliance

No magic numbers

Constants stored centrally

🚀 15. DEPLOYMENT RULES

Use environment variables

No DEBUG=True in production

Use Gunicorn

Proper logging setup

Secure CORS configuration

🔥 16. CURSOR USAGE RULES

When generating code:

Explain architecture before writing code.

Generate module-by-module.

Do not generate entire project at once.

Always show Meta constraints.

Always show permission logic.

Always consider scalability.

If output violates any rule → regenerate.