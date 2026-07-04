"""
Comprehensive Synthetic Data Generator for SPMS.

Populates ALL relational tables for every student in a given college:
  Subjects, Enrollments, ClassSessions, Attendance, Assessments, Marks,
  Assignments, AssignmentSubmissions, Skills, Companies, JobPostings,
  JobApplications, and Feedback.

Usage:
    python populate_all_data.py [COLLEGE_CODE]
    e.g.  python populate_all_data.py GTU

If COLLEGE_CODE is omitted, it runs for ALL colleges in the database.
"""
import os
import sys
import django
import random
from datetime import date, timedelta, datetime
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction
from django.utils import timezone

from apps.users.models import User
from apps.academics.models import (
    College, Student, Teacher, Subject, Enrollment, Batch, Department
)
from apps.attendance.models import ClassSession, Attendance
from apps.assessments.models import Assessment, Marks, AssignmentTask, AssignmentSubmission
from apps.placements.models import Company, JobPosting, Skill, JobSkill, StudentSkill, JobApplication
from apps.communication.models import Feedback
from apps.common.constants import AttendanceStatus, AssessmentType


# ---------------------------------------------------------------------------
# Configuration: Tweak these numbers to control data volume
# ---------------------------------------------------------------------------
SUBJECTS_PER_SEMESTER = 5          # 5 subjects per semester
SESSIONS_PER_SUBJECT = 30         # ~30 classes per subject over a semester
QUIZZES_PER_SUBJECT = 4           # 4 weekly quizzes
INTERNALS_PER_SUBJECT = 2         # 2 internal tests (INTERNAL_1, INTERNAL_2)
ASSIGNMENTS_PER_SUBJECT = 3       # 3 assignments per subject
NUM_SKILLS = 15                   # total skill pool
SKILLS_PER_STUDENT_RANGE = (2, 8) # each student gets 2-8 random skills
NUM_COMPANIES = 6                 # companies in placement cell
JOBS_PER_COMPANY_RANGE = (1, 3)   # 1-3 job postings per company
APPS_PER_STUDENT_RANGE = (0, 4)   # 0-4 job applications per student

# ---------------------------------------------------------------------------
# Subject Bank (realistic CS/IT/DS subjects by semester)
# ---------------------------------------------------------------------------
SUBJECT_BANK = {
    1: ["Mathematics I", "Physics", "Basic Electronics", "Programming in C", "English Communication"],
    2: ["Mathematics II", "Data Structures", "Digital Logic", "Object Oriented Programming", "Environmental Science"],
    3: ["Discrete Mathematics", "Computer Architecture", "Database Management", "Java Programming", "Operating Systems"],
    4: ["Design & Analysis of Algorithms", "Computer Networks", "Software Engineering", "Theory of Computation", "Statistics & Probability"],
    5: ["Machine Learning", "Web Technologies", "Compiler Design", "Information Security", "Cloud Computing"],
    6: ["Deep Learning", "Big Data Analytics", "Mobile App Development", "Internet of Things", "Natural Language Processing"],
    7: ["Artificial Intelligence", "Blockchain Technology", "Distributed Systems", "Computer Vision", "Ethical Hacking"],
    8: ["Project Work", "Internship", "Advanced DBMS", "Quantum Computing", "Research Methodology"],
}

SKILL_NAMES = [
    "Python", "Java", "C++", "JavaScript", "React", "Django",
    "Machine Learning", "SQL", "Git", "Docker", "AWS",
    "Data Analysis", "Communication", "Problem Solving", "Teamwork"
]

COMPANY_DATA = [
    {"name": "TechNova Solutions", "tier": "Tier 1", "desc": "Leading AI & Cloud company", "web": "https://technova.com"},
    {"name": "DataMinds Inc.", "tier": "Tier 1", "desc": "Big Data analytics firm", "web": "https://dataminds.io"},
    {"name": "CloudStack Systems", "tier": "Tier 2", "desc": "Cloud infrastructure provider", "web": "https://cloudstack.dev"},
    {"name": "WebCraft Studios", "tier": "Tier 2", "desc": "Web & mobile development agency", "web": "https://webcraft.in"},
    {"name": "SecureNet Corp", "tier": "Tier 3", "desc": "Cybersecurity services", "web": "https://securenet.co"},
    {"name": "InnoVate Labs", "tier": "Tier 3", "desc": "Startup incubator & dev shop", "web": "https://innovatelabs.io"},
]

JOB_TITLES = [
    "Software Engineer", "Data Scientist", "Backend Developer",
    "Full Stack Developer", "ML Engineer", "DevOps Engineer",
    "Frontend Developer", "Cloud Architect", "Security Analyst",
    "QA Engineer", "Data Analyst", "Product Engineer"
]

ASSIGNMENT_TITLES = [
    "Lab Report", "Case Study Analysis", "Mini Project",
    "Research Survey", "Practical Implementation"
]


def generate_student_archetype():
    """
    Assign each student an archetype that controls their performance
    distribution so the data is realistic and varied for ML.
    """
    r = random.random()
    if r < 0.15:
        return 'high_risk'      # 15% - poor attendance & marks
    elif r < 0.35:
        return 'medium_risk'    # 20% - inconsistent
    elif r < 0.70:
        return 'average'        # 35% - decent
    else:
        return 'top_performer'  # 30% - excellent


def get_attendance_probability(archetype):
    """Return probability of being PRESENT for a given archetype."""
    return {
        'high_risk': 0.45,
        'medium_risk': 0.65,
        'average': 0.82,
        'top_performer': 0.95,
    }[archetype]


def get_marks_range(archetype, max_marks):
    """Return (min_marks, max_marks) for a given archetype."""
    max_val = float(max_marks)
    ranges = {
        'high_risk': (0.10 * max_val, 0.45 * max_val),
        'medium_risk': (0.30 * max_val, 0.65 * max_val),
        'average': (0.50 * max_val, 0.80 * max_val),
        'top_performer': (0.75 * max_val, 0.98 * max_val),
    }
    lo, hi = ranges[archetype]
    return round(random.uniform(lo, hi), 2)


def run(college_code=None):
    """Main entry point."""
    if college_code:
        colleges = College.objects.filter(code=college_code)
        if not colleges.exists():
            print(f"ERROR: College with code '{college_code}' not found.")
            return
    else:
        colleges = College.objects.all()

    for college in colleges:
        print(f"\n{'='*60}")
        print(f"  Populating data for: {college.name} ({college.code})")
        print(f"{'='*60}")
        populate_college(college)

    print("\n[DONE] All done! You can now run ML analysis from the admin dashboard.")


def populate_college(college):
    """Populate all synthetic data for a single college."""
    students = Student.objects.filter(user__college=college).select_related(
        'user', 'batch', 'department'
    )
    teachers = Teacher.objects.filter(user__college=college).select_related('user')

    if not students.exists():
        print(f"  [WARN] No students found for {college.code}. Skipping.")
        return
    if not teachers.exists():
        print(f"  [WARN] No teachers found for {college.code}. Skipping.")
        return

    teacher_list = list(teachers)
    student_list = list(students)

    # Assign archetypes to students
    archetypes = {s.id: generate_student_archetype() for s in student_list}

    with transaction.atomic():
        # Step 1: Create Subjects
        subjects_by_sem = create_subjects(college, teacher_list)

        # Step 2: Enroll Students
        create_enrollments(student_list, subjects_by_sem)

        # Step 3: Create Attendance
        create_attendance(college, student_list, subjects_by_sem, archetypes, teacher_list)

        # Step 4: Create Assessments & Marks
        create_assessments_and_marks(college, student_list, subjects_by_sem, archetypes, teacher_list)

        # Step 5: Create Assignments & Submissions
        create_assignments(college, student_list, subjects_by_sem, archetypes, teacher_list)

        # Step 6: Create Skills
        create_skills(college, student_list, archetypes)

        # Step 7: Create Companies & Job Postings
        create_placements(college, student_list, archetypes)

        # Step 8: Create Feedback
        create_feedback(college, student_list, subjects_by_sem)

    print(f"  [OK] Successfully populated all data for {college.code}!")


def create_subjects(college, teacher_list):
    """Create subjects for all semesters and assign teachers."""
    subjects_by_sem = {}
    teacher_idx = 0

    for sem, names in SUBJECT_BANK.items():
        subjects_by_sem[sem] = []
        for i, name in enumerate(names):
            code = f"{college.code}_{name[:3].upper()}{sem}{i+1:02d}"
            teacher = teacher_list[teacher_idx % len(teacher_list)]
            teacher_idx += 1

            subj, created = Subject.objects.get_or_create(
                college=college,
                code=code,
                defaults={
                    'name': name,
                    'semester': sem,
                    'teacher': teacher,
                }
            )
            subjects_by_sem[sem].append(subj)

    total = sum(len(v) for v in subjects_by_sem.values())
    print(f"  [1/8] Created {total} subjects across 8 semesters.")
    return subjects_by_sem


def create_enrollments(student_list, subjects_by_sem):
    """Enroll each student in subjects matching their semester."""
    count = 0
    for student in student_list:
        sem = student.semester or 1
        subjects = subjects_by_sem.get(sem, [])
        for subj in subjects:
            _, created = Enrollment.objects.get_or_create(
                student=student,
                subject=subj,
                defaults={'is_active': True}
            )
            if created:
                count += 1
    print(f"  [2/8] Created {count} enrollments.")


def create_attendance(college, student_list, subjects_by_sem, archetypes, teacher_list):
    """Create class sessions and attendance records."""
    session_count = 0
    attendance_count = 0
    base_date = date(2026, 1, 6)  # Start of semester

    for sem, subjects in subjects_by_sem.items():
        sem_students = [s for s in student_list if (s.semester or 1) == sem]
        if not sem_students:
            continue

        for subj in subjects:
            teacher_user = subj.teacher.user if subj.teacher else teacher_list[0].user

            for day_offset in range(SESSIONS_PER_SUBJECT):
                session_date = base_date + timedelta(days=day_offset * 2)
                topic = f"Lecture {day_offset + 1}: {subj.name}"

                session, created = ClassSession.objects.get_or_create(
                    subject=subj,
                    date=session_date,
                    defaults={
                        'topic': topic,
                        'created_by': teacher_user,
                    }
                )
                if created:
                    session_count += 1

                for student in sem_students:
                    arch = archetypes[student.id]
                    prob = get_attendance_probability(arch)
                    r = random.random()

                    if r < prob:
                        status = AttendanceStatus.PRESENT
                    elif r < prob + 0.05:
                        status = AttendanceStatus.LATE
                    elif r < prob + 0.08:
                        status = AttendanceStatus.EXCUSED
                    else:
                        status = AttendanceStatus.ABSENT

                    _, created = Attendance.objects.get_or_create(
                        class_session=session,
                        student=student,
                        defaults={'status': status}
                    )
                    if created:
                        attendance_count += 1

    print(f"  [3/8] Created {session_count} sessions, {attendance_count} attendance records.")


def create_assessments_and_marks(college, student_list, subjects_by_sem, archetypes, teacher_list):
    """Create assessments (internals, quizzes, semester exams) and marks."""
    assessment_count = 0
    marks_count = 0
    base_date = date(2026, 1, 15)

    for sem, subjects in subjects_by_sem.items():
        sem_students = [s for s in student_list if (s.semester or 1) == sem]
        if not sem_students:
            continue

        for subj in subjects:
            teacher_user = subj.teacher.user if subj.teacher else teacher_list[0].user

            # --- Internal Tests ---
            internal_types = ['INTERNAL_1', 'INTERNAL_2']
            for idx, itype in enumerate(internal_types[:INTERNALS_PER_SUBJECT]):
                a_date = base_date + timedelta(days=30 * (idx + 1))
                assess, created = Assessment.objects.get_or_create(
                    subject=subj,
                    name=f"Internal Test {idx+1}",
                    date=a_date,
                    defaults={
                        'assessment_type': itype,
                        'max_marks': Decimal('50.00'),
                        'weightage': Decimal('15.00'),
                        'created_by': teacher_user,
                    }
                )
                if created:
                    assessment_count += 1
                for student in sem_students:
                    marks_val = get_marks_range(archetypes[student.id], assess.max_marks)
                    _, cr = Marks.objects.get_or_create(
                        assessment=assess, student=student,
                        defaults={'marks_obtained': Decimal(str(marks_val))}
                    )
                    if cr:
                        marks_count += 1

            # --- Quizzes ---
            for q in range(QUIZZES_PER_SUBJECT):
                q_date = base_date + timedelta(days=15 * (q + 1))
                assess, created = Assessment.objects.get_or_create(
                    subject=subj,
                    name=f"Quiz {q+1}",
                    date=q_date,
                    defaults={
                        'assessment_type': AssessmentType.QUIZ,
                        'max_marks': Decimal('20.00'),
                        'weightage': Decimal('5.00'),
                        'created_by': teacher_user,
                    }
                )
                if created:
                    assessment_count += 1
                for student in sem_students:
                    marks_val = get_marks_range(archetypes[student.id], assess.max_marks)
                    _, cr = Marks.objects.get_or_create(
                        assessment=assess, student=student,
                        defaults={'marks_obtained': Decimal(str(marks_val))}
                    )
                    if cr:
                        marks_count += 1

            # --- Semester Exam ---
            sem_date = base_date + timedelta(days=120)
            assess, created = Assessment.objects.get_or_create(
                subject=subj,
                name="Semester Exam",
                date=sem_date,
                defaults={
                    'assessment_type': AssessmentType.SEMESTER,
                    'max_marks': Decimal('100.00'),
                    'weightage': Decimal('40.00'),
                    'created_by': teacher_user,
                }
            )
            if created:
                assessment_count += 1
            for student in sem_students:
                marks_val = get_marks_range(archetypes[student.id], assess.max_marks)
                _, cr = Marks.objects.get_or_create(
                    assessment=assess, student=student,
                    defaults={'marks_obtained': Decimal(str(marks_val))}
                )
                if cr:
                    marks_count += 1

    print(f"  [4/8] Created {assessment_count} assessments, {marks_count} marks records.")


def create_assignments(college, student_list, subjects_by_sem, archetypes, teacher_list):
    """Create assignment tasks and student submissions with grades."""
    task_count = 0
    submission_count = 0

    for sem, subjects in subjects_by_sem.items():
        sem_students = [s for s in student_list if (s.semester or 1) == sem]
        if not sem_students:
            continue

        for subj in subjects:
            teacher_user = subj.teacher.user if subj.teacher else teacher_list[0].user

            for a_idx in range(ASSIGNMENTS_PER_SUBJECT):
                title = f"{ASSIGNMENT_TITLES[a_idx % len(ASSIGNMENT_TITLES)]} - {subj.code}"
                due = timezone.now() + timedelta(days=random.randint(7, 60))

                task, created = AssignmentTask.objects.get_or_create(
                    subject=subj,
                    title=title,
                    defaults={
                        'description': f"Complete the {title} for {subj.name}.",
                        'due_date': due,
                        'max_marks': Decimal('100.00'),
                        'created_by': teacher_user,
                    }
                )
                if created:
                    task_count += 1

                for student in sem_students:
                    arch = archetypes[student.id]
                    # Not all students submit: high_risk may skip
                    submit_prob = {
                        'high_risk': 0.40,
                        'medium_risk': 0.70,
                        'average': 0.90,
                        'top_performer': 0.98,
                    }[arch]

                    if random.random() < submit_prob:
                        marks_val = get_marks_range(arch, task.max_marks)
                        _, cr = AssignmentSubmission.objects.get_or_create(
                            assignment=task,
                            student=student,
                            defaults={
                                'file': 'assignments/submissions/placeholder.pdf',
                                'marks_obtained': Decimal(str(marks_val)),
                                'remarks': '',
                            }
                        )
                        if cr:
                            submission_count += 1

    print(f"  [5/8] Created {task_count} assignments, {submission_count} submissions.")


def create_skills(college, student_list, archetypes):
    """Create skill objects and assign them to students."""
    skill_objs = []
    for name in SKILL_NAMES:
        s, _ = Skill.objects.get_or_create(college=college, name=name)
        skill_objs.append(s)

    skill_count = 0
    for student in student_list:
        arch = archetypes[student.id]
        num_skills = random.randint(*SKILLS_PER_STUDENT_RANGE)
        if arch == 'top_performer':
            num_skills = min(len(skill_objs), num_skills + 3)
        elif arch == 'high_risk':
            num_skills = max(1, num_skills - 2)

        chosen = random.sample(skill_objs, min(num_skills, len(skill_objs)))
        for sk in chosen:
            prof = {
                'high_risk': random.randint(1, 2),
                'medium_risk': random.randint(2, 3),
                'average': random.randint(3, 4),
                'top_performer': random.randint(4, 5),
            }[arch]
            _, cr = StudentSkill.objects.get_or_create(
                college=college,
                student=student,
                skill=sk,
                defaults={'proficiency': prof}
            )
            if cr:
                skill_count += 1

    print(f"  [6/8] Created {len(skill_objs)} skills, {skill_count} student-skill links.")


def create_placements(college, student_list, archetypes):
    """Create companies, job postings, and student applications."""
    company_objs = []
    for cd in COMPANY_DATA:
        c, _ = Company.objects.get_or_create(
            college=college, name=cd['name'],
            defaults={
                'description': cd['desc'],
                'tier': cd['tier'],
                'website': cd['web'],
            }
        )
        company_objs.append(c)

    # Create job postings with required skills
    all_skills = list(Skill.objects.filter(college=college))
    job_objs = []
    for company in company_objs:
        num_jobs = random.randint(*JOBS_PER_COMPANY_RANGE)
        for _ in range(num_jobs):
            title = random.choice(JOB_TITLES)
            job, created = JobPosting.objects.get_or_create(
                company=company,
                title=title,
                defaults={
                    'college': college,
                    'description': f"{title} role at {company.name}.",
                    'job_type': random.choice(['FULL_TIME', 'INTERNSHIP']),
                    'min_gpa': Decimal(str(round(random.uniform(5.0, 8.0), 2))),
                    'ctc': Decimal(str(round(random.uniform(4.0, 25.0), 2))),
                    'is_active': True,
                    'deadline': timezone.now() + timedelta(days=random.randint(30, 90)),
                }
            )
            if created:
                # Assign 2-4 required skills
                for sk in random.sample(all_skills, min(random.randint(2, 4), len(all_skills))):
                    JobSkill.objects.get_or_create(college=college, job=job, skill=sk)
            job_objs.append(job)

    # Student applications
    app_count = 0
    statuses = ['APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED']
    for student in student_list:
        arch = archetypes[student.id]
        num_apps = random.randint(*APPS_PER_STUDENT_RANGE)
        if arch == 'top_performer':
            num_apps = min(len(job_objs), num_apps + 2)

        chosen_jobs = random.sample(job_objs, min(num_apps, len(job_objs)))
        for job in chosen_jobs:
            status_weights = {
                'high_risk': [0.50, 0.20, 0.15, 0.02, 0.13],
                'medium_risk': [0.35, 0.25, 0.20, 0.08, 0.12],
                'average': [0.20, 0.25, 0.25, 0.15, 0.15],
                'top_performer': [0.10, 0.15, 0.25, 0.40, 0.10],
            }
            status = random.choices(statuses, weights=status_weights[arch], k=1)[0]

            _, cr = JobApplication.objects.get_or_create(
                college=college,
                job=job,
                student=student,
                defaults={'status': status}
            )
            if cr:
                app_count += 1

    print(f"  [7/8] Created {len(company_objs)} companies, {len(job_objs)} jobs, {app_count} applications.")


def create_feedback(college, student_list, subjects_by_sem):
    """Create subject feedback from students."""
    fb_count = 0
    comments_pool = [
        "Great teaching methodology!", "Could use more practical examples.",
        "Very engaging lectures.", "Pace is too fast sometimes.",
        "Excellent course content.", "Need more assignments for practice.",
        "The lab sessions are very helpful.", "Theory-heavy, needs balance.",
        "Best subject this semester!", "Average, but covers the syllabus.",
    ]

    for student in student_list:
        sem = student.semester or 1
        subjects = subjects_by_sem.get(sem, [])
        # Each student gives feedback on ~60% of their subjects
        for subj in subjects:
            if random.random() < 0.60:
                _, cr = Feedback.objects.get_or_create(
                    college=college,
                    student=student.user,
                    subject=subj,
                    defaults={
                        'rating': random.randint(1, 5),
                        'comments': random.choice(comments_pool),
                        'is_anonymous': random.choice([True, False]),
                    }
                )
                if cr:
                    fb_count += 1

    print(f"  [8/8] Created {fb_count} feedback entries.")


if __name__ == '__main__':
    code = sys.argv[1] if len(sys.argv) > 1 else None
    run(code)
