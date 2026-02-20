We are building a multi-tenant academic system using:

- Django
- PostgreSQL
- Custom User model
- Role-based access control
- Offline attendance logging
- Assessment and prediction modules

Design production-ready Django models with:

1. Proper ForeignKey relationships
2. UniqueConstraints at DB level
3. Indexes on frequently queried fields
4. Multi-tenant isolation using college_id
5. Proper on_delete behaviors
6. Atomic transaction safety for critical operations
7. No redundant fields
8. Normalized schema (3NF)

Models required:

- College
- User (custom)
- Student
- Teacher
- Subject (one teacher per subject)
- Enrollment (unique student + subject)
- ClassSession (unique subject + date)
- Attendance (unique class_session + student)
- AssessmentType
- Assessment
- Marks (unique assessment + student)
- Prediction
- Message
- Notification

Show model definitions with Meta constraints explicitly.
Explain reasoning before writing code.
