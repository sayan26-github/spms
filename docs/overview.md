Project Overview: AI-Driven Student Performance Monitoring System 
1. Project Vision 
The AI-Driven Student Performance Monitoring System is a comprehensive digital ecosystem 
designed to optimize educational outcomes through data-driven insights. By centralizing academic, 
behavioral, and feedback data, the platform provides personalized experiences for students, 
actionable insights for teachers, and strategic oversight for institutional heads. 
Things to Understand First: 
This project aims for Indian colleges. So lets understand Indian college structure. 
There are total 8 Semesters 
In each semester 4 internal Tests are taken(offline) – Internal Test 1, 2,3 ,4 . And finally Semester 
Examination(offline). These offlline marks are to be uploaded by the subject teachers for each 
student.  
Each student has a Unique Registration Number (fixed length of characters for all students) that is 
same for all semesters. 
Teachers also have an unique id (fixed length) 
College Admins also have unique id (fixed ) 
The Registration number is predefined and given to students, teachers, and college admins. 
The password initially is the date of birth(DDMMYYYY), which can be changed later. 
An option for “forget password” to reset password must be present. 
2. User Roles and Access Hierarchy 
The system operates on a strictly defined Role-Based Access Control (RBAC) model to ensure data 
privacy and operational efficiency. 
A. Students (Individual Access) 
Scope: Restricted to their own personal data and interactions. 
Key Actions: * Monitor personal academic trends and attendance  
Attendance- Individual Subject Attendance under each subject page. And total attendance (All 
subjects) under the main student dashboard. 
View AI-generated performance predictions and study recommendations.(dedicated page) 
The portal consists a section – Subjects (like google classroom), where the subject teacher uploads 
important study materials under their subject for students to learn.  
There is a section called “Tests” and “Results” where the subject teachers can take small weekly 
tests for the students and give marks 
Initiate direct communication with subject teachers in a dedicated  messaging portal 
Submit feedback on courses and teaching quality. 
B. Teachers (Instructional Access) 
Scope: Access to data for students enrolled in their specific subjects/classes. 
Key Actions: 
Manage and input grades, attendance, and behavioral assessments for their own subject. 
Upload Resources, like recorded lectures , documents,etc. 
Take short test and upload the marks (in Test/Results) tab. 
View class-wide performance heatmaps and "at-risk" student alerts. 
Communicate directly with individual students or institutional leadership. 
Analyze sentiment from student feedback to adjust teaching methodologies. 
C. Institutional Heads / College Heads (Full Access) 
Scope: 100% administrative access to all institutional data. 
Key Actions: 
Provide The students and teachers initial Database, that is their registration number and password 
with a phone number/email for verification(during forget password(otp)),  
With that registration number and password , students and teachers will enter their individual 
portal. 
Upload the College Internal Exam results and Semester results. 
Monitor cross-departmental performance and attendance benchmarks. 
Evaluate faculty performance based on student outcomes and feedback. 
Oversee high-level communication between all user tiers. 
Make data-backed decisions on curriculum changes or resource allocation. 
3. Core Functional Modules 
I. Performance & Attendance Tracking 
Dynamic Dashboards: Visual representation of grades across semesters and real-time attendance 
percentages. 
Trend Tracking: Monitoring the velocity of a student's progress (e.g., identifying a consistent decline 
before it becomes a failure). 
II. AI & Data Science Intelligence Layer 
Predictive Analytics: Models that forecast final grades based on historical data and current 
engagement levels. 
Early Warning System (EWS): Automated flagging of students displaying patterns associated with 
academic struggle (e.g., low attendance + declining quiz scores). 
Sentiment Analysis: Processing qualitative feedback from students to identify general morale or 
specific areas of friction within the curriculum. 
Resource Optimization: Suggesting targeted interventions for students based on their specific 
performance gaps. 
III. Communication Hub 
Direct Messaging: Secure, role-restricted chat channels (Student-Teacher, Teacher-Head). 
Notification Engine: Automated alerts for missed milestones, low attendance, or significant 
performance changes. 
Feedback System: Anonymous or semi-anonymous surveys to gather qualitative data on the 
learning environment. 
4. System Workflow 
Data Acquisition: Raw data is gathered from daily inputs (attendance, marks) and user interactions. 
Intelligence Processing: Data science algorithms clean, analyze, and run predictions on the gathered 
data. 
Insight Generation: The system converts raw analysis into visual dashboards tailored to the user's 
role 
Actionable Intervention: Users use the provided insights to communicate, intervene, or adjust 
strategies to improve performance. 
5. Objectives 
Proactive Intervention: Shift from reactive grading to proactive student support. 
Transparency: Provide students with a clear understanding of their standing and future trajectory. 
Operational Excellence: Empower institutional heads with the data needed to maintain high 
educational standards. 