"""
Generate Synthetic Academic Data for SPMS.

Creates subjects (semesters 6-7), enrollments, assessments (Internal 1, Internal 2, 
Semester Exam, Quizzes), attendance (ClassSessions + records), and marks 
for ALL 100 students across their completed semesters.

Batch logic (June 2026):
  - Batch 2023 -> completed semesters 1-7
  - Batch 2024 -> completed semesters 1-5
  - Batch 2025 -> completed semesters 1-3
  - Batch 2026 -> completed semester 1
"""
import os
import sys
import django
import random
from datetime import date, timedelta
from decimal import Decimal

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from django.db import transaction
from apps.academics.models import (
    College, Batch, Department, Subject, Student, Enrollment
)
from apps.assessments.models import Assessment, Marks
from apps.attendance.models import ClassSession, Attendance
from apps.common.constants import AttendanceStatus

random.seed(42)

# --- CONFIG ---
BATCH_SEMESTERS = {
    2023: 7,
    2024: 5,
    2025: 3,
    2026: 1,
}

# Department code -> subject definitions for semesters 6 & 7
EXTRA_SUBJECTS = {
    'CSE': [
        ('CS302', 'Machine Learning', 6),
        ('CS401', 'Cloud Computing', 7),
    ],
    'ECE': [
        ('EC302', 'Embedded Systems', 6),
        ('EC401', 'Wireless Communication', 7),
    ],
    'EE': [
        ('EE302', 'Renewable Energy', 6),
        ('EE401', 'Smart Grid Systems', 7),
    ],
    'ME': [
        ('ME302', 'Robotics', 6),
        ('ME401', 'CAD/CAM', 7),
    ],
    'CE': [
        ('CE302', 'Transportation Engineering', 6),
        ('CE401', 'Environmental Engineering', 7),
    ],
}

# Assessment types per subject per semester
ASSESSMENT_TYPES = [
    ('Internal Test 1', 'INTERNAL_1', 50),
    ('Internal Test 2', 'INTERNAL_2', 50),
    ('Quiz 1', 'QUIZ', 20),
    ('Quiz 2', 'QUIZ', 20),
    ('Semester Exam', 'SEMESTER', 100),
]

# Student performance profiles (to create variety)
PROFILES = ['excellent', 'good', 'average', 'weak', 'struggling']

def get_student_profile(student_id):
    """Assign a consistent performance profile to each student."""
    idx = student_id % len(PROFILES)
    return PROFILES[idx]

def get_marks_for_profile(profile, max_marks):
    """Generate realistic marks based on student profile."""
    max_m = float(max_marks)
    ranges = {
        'excellent': (0.82, 0.98),
        'good': (0.68, 0.88),
        'average': (0.50, 0.72),
        'weak': (0.35, 0.58),
        'struggling': (0.15, 0.42),
    }
    low, high = ranges[profile]
    # Add some randomness
    noise = random.uniform(-0.05, 0.05)
    pct = random.uniform(low, high) + noise
    pct = max(0.0, min(1.0, pct))
    return round(pct * max_m, 2)

def get_attendance_for_profile(profile):
    """Return attendance probability based on profile."""
    probs = {
        'excellent': 0.92,
        'good': 0.82,
        'average': 0.72,
        'weak': 0.60,
        'struggling': 0.45,
    }
    return probs[profile]


def get_sem_start_date(batch_year, semester):
    """Calculate approximate start date for a semester."""
    # Odd semesters start in August, even in January
    year = batch_year + (semester - 1) // 2
    if semester % 2 == 1:
        return date(year, 8, 1)
    else:
        return date(year + 1, 1, 10)


def run():
    college = College.objects.first()
    if not college:
        print("ERROR: No college found!")
        return

    print(f"College: {college.name}")
    print("=" * 60)

    # --- Step 1: Create missing subjects (semesters 6 & 7) ---
    print("\n[1/5] Creating subjects for semesters 6-7...")
    created_subjects = 0
    for dept_code, subjects_list in EXTRA_SUBJECTS.items():
        for code, name, sem in subjects_list:
            subj, created = Subject.objects.get_or_create(
                college=college, code=code,
                defaults={'name': name, 'semester': sem}
            )
            if created:
                created_subjects += 1
                print(f"  Created: {code} - {name} (Sem {sem})")
    print(f"  -> {created_subjects} new subjects created.")

    # Build department-to-subjects mapping
    dept_code_prefix = {
        'CSE': 'CS', 'ECE': 'EC', 'EE': 'EE', 'ME': 'ME', 'CE': 'CE'
    }
    # Also include CSEDS for CSE
    dept_subjects = {}
    for dept in Department.objects.filter(college=college):
        prefix = dept_code_prefix.get(dept.code, dept.code)
        subjects = list(Subject.objects.filter(
            college=college, code__startswith=prefix
        ).order_by('semester'))
        # Include CSEDS for CSE
        if dept.code == 'CSE':
            extra = Subject.objects.filter(college=college, code='CSEDS')
            existing_ids = [s.id for s in subjects]
            for e in extra:
                if e.id not in existing_ids:
                    subjects.append(e)
            subjects.sort(key=lambda s: s.semester)
        dept_subjects[dept.code] = subjects

    # --- Step 2: Create Enrollments ---
    print("\n[2/5] Creating enrollments...")
    enrollment_count = 0
    students = Student.objects.select_related('user', 'batch', 'department').all()

    for student in students:
        if not student.batch or not student.department:
            continue

        batch_year = student.batch.year
        max_sem = BATCH_SEMESTERS.get(batch_year, 1)
        dept_code = student.department.code
        subjects = dept_subjects.get(dept_code, [])

        for subj in subjects:
            if subj.semester <= max_sem:
                _, created = Enrollment.objects.get_or_create(
                    student=student, subject=subj,
                    defaults={'is_active': subj.semester == max_sem}
                )
                if created:
                    enrollment_count += 1

    print(f"  -> {enrollment_count} enrollments created.")

    # --- Step 3: Create Assessments ---
    print("\n[3/5] Creating assessments...")
    assessment_count = 0
    all_subjects = Subject.objects.filter(college=college)

    for subj in all_subjects:
        for name, a_type, max_marks in ASSESSMENT_TYPES:
            assess_name = f"{name}"
            # Use a reasonable date based on semester
            sem_start = get_sem_start_date(2023, subj.semester)
            if a_type == 'INTERNAL_1':
                assess_date = sem_start + timedelta(days=30)
            elif a_type == 'INTERNAL_2':
                assess_date = sem_start + timedelta(days=75)
            elif a_type == 'SEMESTER':
                assess_date = sem_start + timedelta(days=120)
            elif name == 'Quiz 1':
                assess_date = sem_start + timedelta(days=15)
            else:
                assess_date = sem_start + timedelta(days=60)

            _, created = Assessment.objects.get_or_create(
                subject=subj, name=assess_name, date=assess_date,
                defaults={
                    'assessment_type': a_type,
                    'max_marks': Decimal(str(max_marks)),
                    'weightage': Decimal('20.00'),
                }
            )
            if created:
                assessment_count += 1

    print(f"  -> {assessment_count} assessments created.")

    # --- Step 4: Create Attendance (ClassSessions + records) ---
    print("\n[4/5] Creating attendance records...")
    session_count = 0
    attendance_count = 0

    for subj in all_subjects:
        max_sem = subj.semester
        sem_start = get_sem_start_date(2023, max_sem)

        # Generate ~30 class sessions per subject
        class_dates = []
        current = sem_start + timedelta(days=2)
        for _ in range(30):
            if current.weekday() < 5:
                class_dates.append(current)
            current += timedelta(days=random.choice([2, 3]))
            if len(class_dates) >= 30:
                break

        # Get enrolled students
        enrolled = Enrollment.objects.filter(
            subject=subj
        ).select_related('student')

        with transaction.atomic():
            for d in class_dates:
                session, created = ClassSession.objects.get_or_create(
                    subject=subj, date=d,
                    defaults={'topic': f'{subj.name} - Lecture'}
                )
                if created:
                    session_count += 1

                for enrollment in enrolled:
                    student = enrollment.student
                    profile = get_student_profile(student.id)
                    att_prob = get_attendance_for_profile(profile)

                    if random.random() < att_prob:
                        status = AttendanceStatus.PRESENT
                    elif random.random() < 0.1:
                        status = AttendanceStatus.LATE
                    else:
                        status = AttendanceStatus.ABSENT

                    _, att_created = Attendance.objects.get_or_create(
                        class_session=session, student=student,
                        defaults={'status': status}
                    )
                    if att_created:
                        attendance_count += 1

        if session_count % 100 == 0:
            print(f"  ... {session_count} sessions, {attendance_count} records so far")

    print(f"  -> {session_count} sessions, {attendance_count} attendance records created.")

    # --- Step 5: Create Marks ---
    print("\n[5/5] Creating marks for all students...")
    marks_count = 0
    assessments = Assessment.objects.select_related('subject').all()

    with transaction.atomic():
        for assessment in assessments:
            enrolled = Enrollment.objects.filter(
                subject=assessment.subject
            ).select_related('student')

            for enrollment in enrolled:
                student = enrollment.student
                profile = get_student_profile(student.id)
                obtained = get_marks_for_profile(profile, assessment.max_marks)

                _, created = Marks.objects.get_or_create(
                    assessment=assessment, student=student,
                    defaults={
                        'marks_obtained': Decimal(str(obtained)),
                        'remarks': ''
                    }
                )
                if created:
                    marks_count += 1

        if marks_count % 500 == 0:
            print(f"  ... {marks_count} marks records so far")

    print(f"  -> {marks_count} marks records created.")

    # --- Summary ---
    print("\n" + "=" * 60)
    print("DONE! Summary:")
    print(f"  Subjects:    {Subject.objects.filter(college=college).count()}")
    print(f"  Enrollments: {Enrollment.objects.count()}")
    print(f"  Assessments: {Assessment.objects.count()}")
    print(f"  Sessions:    {ClassSession.objects.count()}")
    print(f"  Attendance:  {Attendance.objects.count()}")
    print(f"  Marks:       {Marks.objects.count()}")
    print("\nYou can now run 'Run Analysis' from the Admin portal!")


if __name__ == '__main__':
    run()
