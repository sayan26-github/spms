import os
import sys
import random
from datetime import timedelta, date, datetime
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.utils import timezone
from apps.users.models import User, UserRole
from apps.academics.models import College, Department, Batch, Subject, Student, Teacher, Enrollment, Resource
from apps.attendance.models import ClassSession, Attendance
from apps.assessments.models import Assessment, Marks, AssignmentTask, AssignmentSubmission
from apps.communication.models import Message, Notification, Feedback
from apps.placements.models import Company, JobPosting, Skill, JobSkill, StudentSkill, JobApplication
from apps.common.constants import AttendanceStatus, AssessmentType, NotificationType
from django.db import transaction

print("Starting HUGE Data Population for Delhi College of Engineering (DCE)...")

def run():
    with transaction.atomic():
        # 1. Core Setup
        college, _ = College.objects.get_or_create(
            code='DCE',
            defaults={
                'name': 'Delhi College of Engineering',
                'address': 'Bawana Road, Delhi',
                'contact_email': 'info@dce.edu',
                'contact_phone': '+91-11-27871018'
            }
        )
        print(f"College: {college.name}")

        admin_user, created = User.objects.get_or_create(
            college=college,
            registration_number='ADMIN01',
            defaults={
                'email': 'admin01@dce.edu',
                'role': UserRole.ADMIN,
                'first_name': 'Super',
                'last_name': 'Admin'
            }
        )
        if created:
            admin_user.set_password("000000")
            admin_user.save()
        print("Admin user created/verified.")

        # Batches
        batch_2023, _ = Batch.objects.get_or_create(college=college, year=2023, defaults={'name': 'Batch 2023-2027'})
        batch_2024, _ = Batch.objects.get_or_create(college=college, year=2024, defaults={'name': 'Batch 2024-2028'})
        
        # Departments
        dept_cs_23, _ = Department.objects.get_or_create(college=college, batch=batch_2023, code="CSE", defaults={'name': "Computer Science and Engineering"})
        dept_me_23, _ = Department.objects.get_or_create(college=college, batch=batch_2023, code="ME", defaults={'name': "Mechanical Engineering"})
        dept_cs_24, _ = Department.objects.get_or_create(college=college, batch=batch_2024, code="CSE", defaults={'name': "Computer Science and Engineering"})
        dept_me_24, _ = Department.objects.get_or_create(college=college, batch=batch_2024, code="ME", defaults={'name': "Mechanical Engineering"})
        print("Batches & Departments created.")

        # Teachers (15)
        print("Creating Teachers...")
        teachers = []
        teacher_names = ["Rajesh Kumar", "Priya Sharma", "Amit Singh", "Neha Gupta", "Vikram Patel", "Sneha Iyer", "Ravi Verma", "Pooja Reddy", "Sunil Joshi", "Anita Desai", "Arjun Nair", "Kavita Rao", "Sanjay Mishra", "Meera Menon", "Karthik Pillai"]
        
        for i, name in enumerate(teacher_names, 1):
            reg_no = f"T{i:03d}"
            first_name, last_name = name.split(" ", 1)
            user, created = User.objects.get_or_create(
                college=college,
                registration_number=reg_no,
                defaults={
                    'email': f'teacher{i}@dce.edu',
                    'role': UserRole.TEACHER,
                    'first_name': first_name,
                    'last_name': last_name
                }
            )
            if created:
                user.set_password("000000")
                user.save()
            teacher = Teacher.objects.get(user=user)
            # Assign dept somewhat randomly or sequentially
            teacher.department = dept_cs_23 if i <= 8 else dept_me_23
            teacher.designation = "Professor" if i % 3 == 0 else "Assistant Professor"
            teacher.save()
            teachers.append(teacher)
        print(f"Created {len(teachers)} Teachers.")

        # 2. Students (200)
        print("Creating Students...")
        students = []
        
        for i in range(1, 201):
            reg_no = f"S{i:03d}"
            user, created = User.objects.get_or_create(
                college=college,
                registration_number=reg_no,
                defaults={
                    'email': f'student{i}@dce.edu',
                    'role': UserRole.STUDENT,
                    'first_name': 'Student',
                    'last_name': str(i)
                }
            )
            if created:
                user.set_password("000000")
                user.save()
                
            student = Student.objects.get(user=user)
            
            # Distribute:
            if i <= 50:
                student.batch, student.department, student.semester = batch_2023, dept_cs_23, 6
            elif i <= 100:
                student.batch, student.department, student.semester = batch_2023, dept_me_23, 6
            elif i <= 150:
                student.batch, student.department, student.semester = batch_2024, dept_cs_24, 4
            else:
                student.batch, student.department, student.semester = batch_2024, dept_me_24, 4
                
            student.bio = f"Hi, I'm {student.user.first_name}."
            student.save()
            students.append(student)
        print(f"Created {len(students)} Students.")

        # 3. Subjects & Enrollments
        print("Creating Subjects and Enrollments...")
        subject_names_cs = [
            ("CS301", "Data Structures & Algorithms", 3),
            ("CS302", "Operating Systems", 3),
            ("CS401", "Database Management Systems", 4),
            ("CS402", "Computer Networks", 4),
            ("CS501", "Artificial Intelligence", 5),
            ("CS502", "Software Engineering", 5),
            ("CS601", "Machine Learning", 6),
            ("CS602", "Cloud Computing", 6)
        ]
        
        subject_names_me = [
            ("ME301", "Thermodynamics", 3),
            ("ME302", "Fluid Mechanics", 3),
            ("ME401", "Strength of Materials", 4),
            ("ME402", "Manufacturing Processes", 4),
            ("ME501", "Heat Transfer", 5),
            ("ME502", "Machine Design", 5),
            ("ME601", "Robotics & Automation", 6)
        ]

        subjects = []
        teacher_idx = 0
        for code, name, sem in subject_names_cs:
            subj, _ = Subject.objects.get_or_create(
                college=college, code=code,
                defaults={'name': name, 'semester': sem, 'teacher': teachers[teacher_idx]}
            )
            subjects.append((subj, 'CSE'))
            teacher_idx = (teacher_idx + 1) % len(teachers)
            
        for code, name, sem in subject_names_me:
            subj, _ = Subject.objects.get_or_create(
                college=college, code=code,
                defaults={'name': name, 'semester': sem, 'teacher': teachers[teacher_idx]}
            )
            subjects.append((subj, 'ME'))
            teacher_idx = (teacher_idx + 1) % len(teachers)

        Enrollment.objects.filter(subject__college=college).delete()
        enrollments_to_create = []
        
        for subj, dept_type in subjects:
            for st in students:
                # CSE students
                if dept_type == 'CSE' and st.department.code == 'CSE':
                    if (st.batch.year == 2023 and subj.semester <= 6) or (st.batch.year == 2024 and subj.semester <= 4):
                        enrollments_to_create.append(Enrollment(student=st, subject=subj, is_active=True))
                # ME students
                elif dept_type == 'ME' and st.department.code == 'ME':
                    if (st.batch.year == 2023 and subj.semester <= 6) or (st.batch.year == 2024 and subj.semester <= 4):
                        enrollments_to_create.append(Enrollment(student=st, subject=subj, is_active=True))

        Enrollment.objects.bulk_create(enrollments_to_create, ignore_conflicts=True)
        print(f"Created {len(enrollments_to_create)} Enrollments.")

        # 4, 5, 6, 8. Teacher Portal Actions
        print("Generating Attendance, Assessments, Assignments, Resources...")
        ClassSession.objects.filter(college=college).delete()
        Assessment.objects.filter(college=college).delete()
        AssignmentTask.objects.filter(college=college).delete()
        Resource.objects.filter(subject__college=college).delete()

        student_attendance_prob = {}
        for st in students:
            r = random.random()
            if r < 0.6: student_attendance_prob[st.id] = 0.90
            elif r < 0.8: student_attendance_prob[st.id] = 0.70
            else: student_attendance_prob[st.id] = 0.50

        sem_start_dates = {
            3: date(2024, 8, 1),
            4: date(2025, 1, 10),
            5: date(2025, 8, 1),
            6: date(2026, 1, 10),
        }

        attendance_buffer = []
        marks_buffer = []
        submissions_buffer = []
        resources_buffer = []

        total_sessions = 0
        total_assessments = 0
        total_tasks = 0

        for subj, dept_type in subjects:
            teacher = subj.teacher
            enrolled_students = [e.student for e in enrollments_to_create if e.subject == subj]
            start_dt = sem_start_dates.get(subj.semester, timezone.now().date() - timedelta(days=90))
            
            for day in range(1, 41):
                session_dt = start_dt + timedelta(days=day*3)
                session, _ = ClassSession.objects.get_or_create(
                    college=college, subject=subj, date=session_dt,
                    defaults={'topic': f"Lecture {day} on {subj.name}", 'created_by': teacher.user}
                )
                total_sessions += 1
                
                for st in enrolled_students:
                    prob = student_attendance_prob[st.id]
                    rand_val = random.random()
                    if rand_val < prob: status = AttendanceStatus.PRESENT
                    elif rand_val < prob + 0.05: status = AttendanceStatus.LATE
                    else: status = AttendanceStatus.ABSENT
                        
                    attendance_buffer.append(Attendance(
                        college=college, class_session=session, student=st, status=status
                    ))
                    
                    if len(attendance_buffer) >= 10000:
                        Attendance.objects.bulk_create(attendance_buffer, ignore_conflicts=True)
                        attendance_buffer.clear()

            assessments_def = [
                ("Internal Test 1", AssessmentType.INTERNAL_1, 50, start_dt + timedelta(days=30)),
                ("Internal Test 2", AssessmentType.INTERNAL_2, 50, start_dt + timedelta(days=60)),
                ("Internal Test 3", AssessmentType.INTERNAL_3, 50, start_dt + timedelta(days=90)),
                ("Weekly Quiz", AssessmentType.QUIZ, 25, start_dt + timedelta(days=45)),
                ("Semester Exam", AssessmentType.SEMESTER, 100, start_dt + timedelta(days=120))
            ]

            for a_name, a_type, max_m, a_date in assessments_def:
                assmt, _ = Assessment.objects.get_or_create(
                    college=college, subject=subj, name=a_name, date=a_date,
                    defaults={'assessment_type': a_type, 'max_marks': max_m, 'created_by': teacher.user}
                )
                total_assessments += 1
                
                for st in enrolled_students:
                    prob = student_attendance_prob[st.id]
                    if prob > 0.8: score_pct = random.uniform(0.75, 1.0)
                    elif prob > 0.6: score_pct = random.uniform(0.5, 0.8)
                    else: score_pct = random.uniform(0.25, 0.6)
                        
                    marks_val = Decimal(score_pct * max_m).quantize(Decimal('0.00'))
                    marks_buffer.append(Marks(
                        college=college, assessment=assmt, student=st, marks_obtained=marks_val
                    ))
                    
                    if len(marks_buffer) >= 10000:
                        Marks.objects.bulk_create(marks_buffer, ignore_conflicts=True)
                        marks_buffer.clear()

            tasks_def = [
                ("Lab Assignment 1", 100, start_dt + timedelta(days=40)),
                ("Research Project", 100, start_dt + timedelta(days=110))
            ]
            for t_name, t_max, t_due in tasks_def:
                due_datetime = timezone.make_aware(datetime.combine(t_due, datetime.min.time()))
                task, _ = AssignmentTask.objects.get_or_create(
                    college=college, subject=subj, title=t_name,
                    defaults={'max_marks': t_max, 'due_date': due_datetime, 'created_by': teacher.user}
                )
                total_tasks += 1
                
                for st in enrolled_students:
                    prob = student_attendance_prob[st.id]
                    if random.random() < prob + 0.1:
                        score_pct = random.uniform(prob - 0.2, prob + 0.1)
                        score_pct = max(0, min(1.0, score_pct))
                        marks_val = Decimal(score_pct * t_max).quantize(Decimal('0.00'))
                        submissions_buffer.append(AssignmentSubmission(
                            college=college, assignment=task, student=st, marks_obtained=marks_val
                        ))
                
                if len(submissions_buffer) >= 5000:
                    AssignmentSubmission.objects.bulk_create(submissions_buffer, ignore_conflicts=True)
                    submissions_buffer.clear()
            
            resources_def = [
                ("Lecture Notes - Unit 1", "https://example.com/notes1"),
                ("Reference Textbook PDF", "https://example.com/textbook"),
                ("Tutorial Video", "https://example.com/video")
            ]
            for r_title, r_link in resources_def:
                resources_buffer.append(Resource(
                    subject=subj, title=r_title, link=r_link
                ))

        if attendance_buffer:
            Attendance.objects.bulk_create(attendance_buffer, ignore_conflicts=True)
        if marks_buffer:
            Marks.objects.bulk_create(marks_buffer, ignore_conflicts=True)
        if submissions_buffer:
            AssignmentSubmission.objects.bulk_create(submissions_buffer, ignore_conflicts=True)
        if resources_buffer:
            Resource.objects.bulk_create(resources_buffer, ignore_conflicts=True)
            
        print(f"Created {total_sessions} Sessions, {total_assessments} Assessments, {total_tasks} Assignment Tasks.")

        # 7. Placements & Skills
        print("Generating Placements data...")
        Company.objects.filter(college=college).delete()
        Skill.objects.filter(college=college).delete()

        companies_data = [
            ("Google India", "Tier 1"), ("Tata Consultancy Services", "Tier 1"), 
            ("Infosys", "Tier 2"), ("L&T Engineering", "Tier 2"), ("Startup Hub AI", "Tier 3")
        ]
        companies = []
        for c_name, c_tier in companies_data:
            comp, _ = Company.objects.get_or_create(college=college, name=c_name, defaults={'tier': c_tier})
            companies.append(comp)

        skills_data = ["Python", "Java", "C++", "JavaScript", "SQL", "Machine Learning", "Data Science", "CAD", "Thermodynamics", "MATLAB", "React", "Cloud Computing"]
        skills = []
        for s_name in skills_data:
            sk, _ = Skill.objects.get_or_create(college=college, name=s_name)
            skills.append(sk)

        jobs = []
        for i in range(15):
            comp = companies[i % len(companies)]
            job, _ = JobPosting.objects.get_or_create(
                college=college, company=comp, title=f"Software Engineer {i}" if comp.name != "L&T Engineering" else f"Mechanical Engineer {i}",
                defaults={
                    'description': 'A fantastic role for freshers.', 
                    'min_gpa': Decimal(random.uniform(6.0, 8.5)).quantize(Decimal('0.00')), 
                    'ctc': Decimal(random.randint(4, 25)),
                    'deadline': timezone.now() + timedelta(days=30)
                }
            )
            jobs.append(job)
            
            job_skills = random.sample(skills, random.randint(2, 4))
            for sk in job_skills:
                JobSkill.objects.get_or_create(college=college, job=job, skill=sk)

        student_skills_buffer = []
        job_applications_buffer = []
        
        for st in students:
            st_skills = random.sample(skills, random.randint(3, 5))
            for sk in st_skills:
                prof = random.randint(2, 5)
                student_skills_buffer.append(StudentSkill(
                    college=college, student=st, skill=sk, proficiency=prof
                ))
            
            st_jobs = random.sample(jobs, 2)
            for job in st_jobs:
                r = random.random()
                if r < 0.1: status = 'OFFERED'
                elif r < 0.3: status = 'SHORTLISTED'
                elif r < 0.5: status = 'INTERVIEWED'
                elif r < 0.8: status = 'REJECTED'
                else: status = 'APPLIED'
                
                job_applications_buffer.append(JobApplication(
                    college=college, job=job, student=st, status=status
                ))

        StudentSkill.objects.bulk_create(student_skills_buffer, ignore_conflicts=True)
        JobApplication.objects.bulk_create(job_applications_buffer, ignore_conflicts=True)
        print("Placements data generated.")

        # 8. Communication
        print("Generating Messages, Feedback, Notifications...")
        msg_buffer = []
        feedback_buffer = []
        notif_buffer = []

        for teacher in teachers:
            for _ in range(6):
                st = random.choice(students)
                msg_buffer.append(Message(
                    college=college, sender=teacher.user, receiver=st.user, 
                    subject="Checking in on your progress", body="Please meet me during office hours.",
                    is_read=random.choice([True, False])
                ))

        for st in students:
            enrolled = [e for e in enrollments_to_create if e.student == st]
            if enrolled:
                subj = random.choice(enrolled).subject
                feedback_buffer.append(Feedback(
                    college=college, student=st.user, subject=subj,
                    rating=random.randint(3, 5), comments="Great subject!"
                ))
                
            notif_buffer.append(Notification(
                college=college, recipient=st.user, title="Welcome to DCE",
                message="Your account is fully set up.", notification_type=NotificationType.SYSTEM
            ))

        Message.objects.bulk_create(msg_buffer, ignore_conflicts=True)
        Feedback.objects.bulk_create(feedback_buffer, ignore_conflicts=True)
        Notification.objects.bulk_create(notif_buffer, ignore_conflicts=True)
        
        print("Data Population Completed Successfully!")

if __name__ == "__main__":
    run()
