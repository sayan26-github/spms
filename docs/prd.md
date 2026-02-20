Product Requirements Document (PRD)
AI-Driven Student Performance Monitoring System (SPMS)
Version 1.0
1. Product Overview
The AI-Driven Student Performance Monitoring System (SPMS) is a multi-tenant academic
intelligence platform designed for Indian colleges.
The system digitizes offline attendance and assessment records, aggregates semester-based
performance data, and generates predictive academic insights using machine learning.
2. Problem Statement
Colleges often maintain attendance and assessment data in fragmented formats such as paper
records or spreadsheets.
There is no centralized system for semester-wise aggregation, predictive performance analysis, or
early risk identification.
3. Product Goals
Digitize offline academic processes.
Provide role-based dashboards for Students, Teachers, and Admin.
Enable semester-wise attendance and marks aggregation.
Generate predictive academic insights and risk classification.
Prepare the platform for future SaaS deployment.
4. Target Users
Students: View attendance, marks, and prediction reports.
Teachers: Upload attendance, create assessments, upload marks, and view analytics.
Admin/Head: Manage users, subjects, and oversee institutional analytics.
5. Core Features (MVP Scope)
JWT-based authentication and role-based access control.
Subject creation and teacher assignment.
Attendance session creation with duplicate prevention.
Attendance editing and semester aggregation.
Assessment creation and marks upload.
Prediction engine using attendance and internal marks.
Basic messaging and notification system.
6. Technical Stack
Frontend: React (Single Page Application).
Backend: Django + Django REST Framework.
Database: PostgreSQL.
Analytics Engine: Python (Pandas, Scikit-learn).
Communication: Polling-based messaging APIs.
7. Success Metrics
Accurate attendance aggregation.
Correct role-based access enforcement.
Prediction output generation.
System response time under 3 seconds for dashboards.
Successful deployment in a college environment.
8. Constraints & Assumptions
Attendance is uploaded manually by teachers after offline classes.
One subject is assigned to one teacher.
Students cannot drop subjects mid-semester.
Duplicate attendance sessions for the same subject/date are prevented.
9. Future Roadmap
Audit logging and semester locking.
Advanced machine learning models.
Multi-college SaaS subscription model.
Real-time notifications using WebSockets.
Faculty performance analytics.