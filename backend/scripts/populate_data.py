import os
import sys
import random
from datetime import timedelta
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
from apps.attendance.services import AttendanceService
from apps.assessments.models import Assessment, Marks, AssignmentTask, AssignmentSubmission
from apps.assessments.services import AssessmentService
from apps.communication.models import Message, Notification
from apps.placements.models import Company, JobPosting, Skill, JobSkill, StudentSkill, JobApplication
from apps.common.constants import AttendanceStatus, AssessmentType

def run():
    print("Starting huge data population...")

    # 1. Core Setup
    college, _ = College.objects.get_or_create(
        name="Institute of Engineering",
        defaults={'code': 'IOE', 'address': '123 Engineering Way'}
    )
    print(f"College: {college.name}")

    admin_user, created = User.objects.get_or_create(
        username="IOE_ADMIN01",
        defaults={
            'email': 'admin01@ioe.edu',
            'role': UserRole.ADMIN,
            'college': college,
            'first_name': 'Super',
            'last_name': 'Admin',
            'registration_number': 'ADMIN01'
        }
    )
    if created:
        admin_user.set_password("000000")
        admin_user.save()
    print("Admin user created/verified.")

    # 2. Teachers
    print("Creating Teachers...")
    teachers = []
    for i in range(1, 16):
        reg_no = f"T{i:03d}"
        user, created = User.objects.get_or_create(
            username=f"IOE_{reg_no}",
            defaults={
                'email': f'teacher{i}@ioe.edu',
                'role': UserRole.TEACHER,
                'college': college,
                'first_name': 'Teacher',
                'last_name': str(i),
                'registration_number': reg_no
            }
        )
        if created:
            user.set_password("000000")
            user.save()
        
        # Ensure Teacher object exists (signals might have created it, but let's be safe)
        teacher, _ = Teacher.objects.get_or_create(user=user)
        teachers.append(teacher)
    
    # 3. Batches and Departments
    print("Creating Batches and Departments...")
    batch_2023, _ = Batch.objects.get_or_create(
        college=college, name="Batch 2023-2027", year=2023
    )
    batch_2024, _ = Batch.objects.get_or_create(
        college=college, name="Batch 2024-2028", year=2024
    )
    
    dept_cs, _ = Department.objects.get_or_create(
        college=college, code="CSE", name="Computer Science and Engineering", batch=batch_2024
    )
    # Re-assign batch to avoid errors if unique constraints hit, wait, Department has batch as a ForeignKey? Let's check models again. 
    # Yes, earlier I saw Department has a batch field. I'll just assign batch_2023 for CS and batch_2024 for ME to avoid errors, or wait, if batch is on Department, each batch-department combination requires a unique Department object? That doesn't make sense, but earlier I saw department had `batch`.
    # Actually I just remembered I removed `batch` from `Department` in tests? No, I added `batch=self.batch` in tests.
    
    # Wait, earlier I fixed `Batch` to NOT have `department`, but `Department` had `batch`?
    # Let me just provide batch to Dept to be safe.
    dept_me, _ = Department.objects.get_or_create(
        college=college, code="ME", name="Mechanical Engineering", batch=batch_2024
    )

    # 4. Students
    print("Creating Students...")
    students = []
    
    # We need 200 students. We will distribute them 50 per batch-dept combination.
    for i in range(1, 201):
        reg_no = f"S{i:03d}"
        user, created = User.objects.get_or_create(
            username=f"IOE_{reg_no}",
            defaults={
                'email': f'student{i}@ioe.edu',
                'role': UserRole.STUDENT,
                'college': college,
                'first_name': 'Student',
                'last_name': str(i),
                'registration_number': reg_no
            }
        )
        if created:
            user.set_password("000000")
            user.save()
            
        student = Student.objects.get(user=user)
        
        # Distribute:
        if i <= 50:
            student.batch, student.department = batch_2023, dept_cs
        elif i <= 100:
            student.batch, student.department = batch_2023, dept_me
        elif i <= 150:
            student.batch, student.department = batch_2024, dept_cs
        else:
            student.batch, student.department = batch_2024, dept_me
            
        student.save()
        students.append(student)

    # 5. Subjects and Enrollments
    print("Creating Subjects and enrolling students...")
    subject_names_cs = [
        "Data Structures", "Algorithms", "Operating Systems", "Computer Networks", 
        "Database Management", "Software Engineering", "Artificial Intelligence", "Machine Learning"
    ]
    subject_names_me = [
        "Thermodynamics", "Fluid Mechanics", "Solid Mechanics", "Heat Transfer",
        "Machine Design", "Manufacturing Processes", "Robotics"
    ]
    
    subjects = []
    teacher_idx = 0
    
    # Create CS subjects
    for name in subject_names_cs:
        subj, _ = Subject.objects.get_or_create(
            college=college, code=name[:3].upper() + "101", 
            defaults={'name': name, 'semester': 3, 'teacher': teachers[teacher_idx]}
        )
        subjects.append((subj, dept_cs))
        teacher_idx = (teacher_idx + 1) % len(teachers)
        
    # Create ME subjects
    for name in subject_names_me:
        subj, _ = Subject.objects.get_or_create(
            college=college, code=name[:3].upper() + "101", 
            defaults={'name': name, 'semester': 3, 'teacher': teachers[teacher_idx]}
        )
        subjects.append((subj, dept_me))
        teacher_idx = (teacher_idx + 1) % len(teachers)

    # Enroll students
    print("Generating Enrollments...")
    Enrollment.objects.filter(subject__college=college).delete()
    
    enrollments_to_create = []
    for subj, dept in subjects:
        dept_students = [s for s in students if s.department == dept]
        for st in dept_students:
            enrollments_to_create.append(Enrollment(student=st, subject=subj, is_active=True))
            
    Enrollment.objects.bulk_create(enrollments_to_create, ignore_conflicts=True)
    print(f"Created {len(enrollments_to_create)} enrollments.")

    # 6. Placements
    print("Generating Placements data...")
    companies_data = ["TechCorp", "MechDyn", "InnovaSystems", "NextGen Auto", "DataWorks"]
    companies = []
    for c_name in companies_data:
        comp, _ = Company.objects.get_or_create(college=college, name=c_name, defaults={'tier': 'Tier 1'})
        companies.append(comp)
        
    skills_data = ["Python", "Java", "C++", "CAD", "Thermodynamics", "Machine Learning", "React", "SQL"]
    skills = []
    for s_name in skills_data:
        sk, _ = Skill.objects.get_or_create(college=college, name=s_name)
        skills.append(sk)
        
    jobs = []
    for i in range(15):
        comp = random.choice(companies)
        job, _ = JobPosting.objects.get_or_create(
            college=college, company=comp, title=f"Role {i}",
            defaults={
                'description': 'A great role.', 'min_gpa': 7.0, 'ctc': Decimal(random.randint(5, 20)),
                'deadline': timezone.now() + timedelta(days=30)
            }
        )
        jobs.append(job)
        JobSkill.objects.get_or_create(college=college, job=job, skill=random.choice(skills))

    for st in students:
        st_skills = random.sample(skills, 3)
        for sk in st_skills:
            StudentSkill.objects.get_or_create(college=college, student=st, skill=sk, defaults={'proficiency': 4})
        
        st_jobs = random.sample(jobs, 2)
        for job in st_jobs:
            JobApplication.objects.get_or_create(college=college, job=job, student=st)

    # 7. Teacher Portal Actions
    print("Generating Attendance, Assessments, Assignments, Messages...")
    ClassSession.objects.filter(college=college).delete()
    Assessment.objects.filter(college=college).delete()
    AssignmentTask.objects.filter(college=college).delete()

    for subj, dept in subjects:
        teacher = subj.teacher
        enrolled_students = [s for s in students if s.department == dept]
        
        base_date = timezone.now().date() - timedelta(days=30)
        for day in range(1, 11):
            session_date = base_date + timedelta(days=day*2)
            session, _ = ClassSession.objects.get_or_create(
                college=college, subject=subj, date=session_date, 
                defaults={'topic': f"Topic {day}", 'created_by': teacher.user}
            )
            att_records = []
            for st in enrolled_students:
                status = AttendanceStatus.PRESENT if random.random() > 0.2 else AttendanceStatus.ABSENT
                att_records.append(Attendance(
                    college=college, class_session=session, student=st, status=status
                ))
            Attendance.objects.bulk_create(att_records, ignore_conflicts=True)

        midterm, _ = Assessment.objects.get_or_create(
            college=college, subject=subj, name="Midterm", assessment_type=AssessmentType.INTERNAL_1,
            defaults={'max_marks': 100, 'date': timezone.now().date() - timedelta(days=15), 'created_by': teacher.user}
        )
        final, _ = Assessment.objects.get_or_create(
            college=college, subject=subj, name="Finals", assessment_type=AssessmentType.SEMESTER,
            defaults={'max_marks': 100, 'date': timezone.now().date(), 'created_by': teacher.user}
        )
        
        midterm_marks = []
        final_marks = []
        for st in enrolled_students:
            midterm_marks.append({'student_id': st.id, 'marks': Decimal(random.randint(40, 100))})
            final_marks.append({'student_id': st.id, 'marks': Decimal(random.randint(40, 100))})
            
        AssessmentService.bulk_add_marks(midterm, midterm_marks)
        AssessmentService.bulk_add_marks(final, final_marks)

        task, _ = AssignmentTask.objects.get_or_create(
            college=college, subject=subj, title="Assignment 1",
            defaults={'due_date': timezone.now() + timedelta(days=7), 'created_by': teacher.user, 'max_marks': 100}
        )
        subs = []
        for st in enrolled_students:
            subs.append(AssignmentSubmission(
                college=college, assignment=task, student=st, marks_obtained=Decimal(random.randint(70, 100))
            ))
        AssignmentSubmission.objects.bulk_create(subs, ignore_conflicts=True)
        
        Resource.objects.get_or_create(
            subject=subj, title="Lecture Notes", defaults={'link': 'https://example.com/notes'}
        )
        
        for st in random.sample(enrolled_students, 2):
            Message.objects.get_or_create(
                sender=teacher.user, receiver=st.user, subject="Coursework Check",
                defaults={'body': f"Hello {st.user.first_name}, how is the coursework?", 'college': college}
            )

    print("Data Population Completed Successfully!")

if __name__ == "__main__":
    run()
