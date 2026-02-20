
Structured Prompt Framework for AI IDE Usage
1. Project Context
Multi-tenant academic intelligence system (college_id isolation).
Backend: Django REST Framework.
Database: PostgreSQL.
Frontend: React SPA.
JWT authentication with role-based access control.
Offline attendance and assessment digitization.
2. Backend Folder Structure
backend/config/
backend/apps/users/
backend/apps/academics/
backend/apps/attendance/
backend/apps/assessments/
backend/apps/analytics/
backend/apps/communication/
backend/apps/common/
Use service layer pattern and modular architecture.
3. Security & Authentication Standards
Custom User model using AbstractBaseUser.
Unique constraint: (college_id, registration_number).
JWT-based authentication.
Role enum: STUDENT, TEACHER, ADMIN, HEAD.
All queries filtered by college_id.
4. Attendance Module Rules
ClassSession unique constraint (subject_id, date).
Attendance unique constraint (class_session_id, student_id).
Only assigned teacher can create/edit sessions.
Unmarked students default to ABSENT.
Semester total attendance is weighted aggregation.
5. Assessment & Marks Module
AssessmentType configurable per college.
Teacher creates assessments and uploads marks.
Marks unique per (assessment_id, student_id).
Student views only personal marks.
6. Analytics & Prediction Module
Use Pandas and Scikit-learn (Linear Regression for MVP).
Inputs: Attendance percentage and internal average.
Outputs: predicted_score and risk_level.
Store predictions in database.
Keep ML logic inside analytics module.
7. API Design Standards
All endpoints prefixed with /api/v1/.
Proper HTTP status codes and validation responses.
No business logic inside views or serializers.
8. Code Quality Standards
Functions under 50 lines.
Cyclomatic complexity under 10.
No duplicated code.
Proper indexing on major foreign keys.
Strict permission enforcement.
9. Performance Guidelines
Indexes on college_id, student_id, subject_id.
Composite index on (subject_id, date).
Avoid unnecessary frontend re-renders.
Use memoization when required.
10. Anti-Patterns to Avoid
Business logic inside React components.
Unfiltered database queries.
Hardcoded values.
Large monolithic components.
Missing validation or constraints.
11. Testing Expectations
Unit tests for service layer.
API tests for attendance and marks.
Prediction validation tests.
Minimum 70 percent coverage target.
12. Deployment Standards
Use Gunicorn for backend.
Environment variables stored in .env.
Production build optimized for frontend.
DEBUG disabled in production.