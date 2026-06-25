import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.academics.models import College, Department, Subject, Teacher

college = College.objects.first()

departments_data = [
    {"name": "Computer Science and Engineering", "code": "CSE"},
    {"name": "Electronics and Communication Engineering", "code": "ECE"},
    {"name": "Electrical Engineering", "code": "EE"},
    {"name": "Mechanical Engineering", "code": "ME"},
    {"name": "Civil Engineering", "code": "CE"},
]

# Create Departments
for d in departments_data:
    Department.objects.get_or_create(
        college=college,
        code=d["code"],
        defaults={"name": d["name"], "batch": None}
    )

print("Created 5 Departments.")

# Mapping for teachers to subject codes
dept_mapping = {
    'Computer Science & Engineering': 'CSE',
    'Electronics and Communication Engineering': 'ECE',
    'Electrical Engineering': 'EE',
    'Mechanical Engineering': 'ME',
    'Civil Engineering': 'CE'
}

# Subjects to create per department
subjects_data = {
    'CSE': [("Data Structures", "CS101", 1), ("Algorithms", "CS102", 2), ("Database Systems", "CS201", 3), ("Operating Systems", "CS202", 4), ("Computer Networks", "CS301", 5)],
    'ECE': [("Basic Electronics", "EC101", 1), ("Digital Logic", "EC102", 2), ("Signals & Systems", "EC201", 3), ("Microprocessors", "EC202", 4), ("VLSI Design", "EC301", 5)],
    'EE': [("Electrical Circuits", "EE101", 1), ("Electromagnetics", "EE102", 2), ("Power Systems", "EE201", 3), ("Control Systems", "EE202", 4), ("Electrical Machines", "EE301", 5)],
    'ME': [("Engineering Mechanics", "ME101", 1), ("Thermodynamics", "ME102", 2), ("Fluid Mechanics", "ME201", 3), ("Manufacturing Processes", "ME202", 4), ("Machine Design", "ME301", 5)],
    'CE': [("Engineering Drawing", "CE101", 1), ("Solid Mechanics", "CE102", 2), ("Structural Analysis", "CE201", 3), ("Fluid Dynamics", "CE202", 4), ("Geotechnical Engineering", "CE301", 5)],
}

created_subjects = 0
assigned_teachers = 0

for teacher_dept_name, dept_code in dept_mapping.items():
    # Get teachers for this department
    teachers = list(Teacher.objects.filter(department=teacher_dept_name, user__college=college))
    
    if not teachers:
        print(f"No teachers found for {teacher_dept_name}")
        continue
        
    subs = subjects_data.get(dept_code, [])
    
    for i, (sub_name, sub_code, sem) in enumerate(subs):
        # Assign a teacher cyclically
        teacher = teachers[i % len(teachers)]
        
        subject, created = Subject.objects.get_or_create(
            college=college,
            code=sub_code,
            defaults={
                "name": sub_name,
                "semester": sem,
                "teacher": teacher
            }
        )
        if created:
            created_subjects += 1
            assigned_teachers += 1
        elif subject.teacher != teacher:
            subject.teacher = teacher
            subject.save()
            assigned_teachers += 1

print(f"Created {created_subjects} new subjects.")
print(f"Assigned teachers to {assigned_teachers} subjects.")
