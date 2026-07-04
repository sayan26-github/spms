import os, django, json, random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.academics.models import College, Student, Batch, Department, Teacher
from apps.common.constants import UserRole

def main():
    # 1. Create College
    college_code = "GTU"
    college_name = "Global Tech University"
    college, created = College.objects.get_or_create(
        code=college_code,
        defaults={'name': college_name, 'contact_email': 'admin@gtu.edu', 'contact_phone': '1234567890'}
    )
    
    # 2. Create Admin
    admin_reg = "GTU_ADMIN_01"
    admin_user, _ = User.objects.get_or_create(
        registration_number=admin_reg,
        college=college,
        defaults={
            'first_name': 'GTU', 'last_name': 'Admin', 'email': 'admin@gtu.edu',
            'role': UserRole.ADMIN,
        }
    )
    admin_user.set_password('Admin@123')
    admin_user.save()

    # 3. Create Departments
    depts = [
        {'code': 'CS', 'name': 'Computer Science'},
        {'code': 'IT', 'name': 'Information Technology'},
        {'code': 'DS', 'name': 'Data Science'}
    ]
    department_objs = {}
    for d in depts:
        dept, _ = Department.objects.get_or_create(college=college, code=d['code'], defaults={'name': d['name']})
        department_objs[d['code']] = dept

    # 4. Create Batches
    batches = {}
    for year in [2023, 2024, 2025]:
        batch, _ = Batch.objects.get_or_create(college=college, year=year, defaults={'name': f"{year}-{year+4}"})
        batches[year] = batch

    # 5. Generate Teachers Dataset
    first_names = ["Arun", "Bina", "Chetan", "Deepa", "Esha", "Farhan", "Gita", "Hari", "Isha", "Jatin"]
    last_names = ["Kumar", "Sharma", "Singh", "Patel", "Das", "Bose", "Ghosh", "Reddy", "Nair", "Iyer"]

    teachers_data = []
    for i in range(1, 16):
        dept = random.choice(depts)
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        teachers_data.append({
            "registration_number": f"GTU_T_{i:03d}",
            "password": "Teach@123",
            "first_name": fn,
            "last_name": ln,
            "email": f"{fn.lower()}.{ln.lower()}{i}@gtu.edu",
            "department_code": dept['code'],
            "department_name": dept['name'],
            "designation": random.choice(["Professor", "Assistant Professor", "Associate Professor"])
        })

    # Save to JSON
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'datafolder')
    os.makedirs(data_dir, exist_ok=True)
    teachers_file = os.path.join(data_dir, 'gtu_teachers.json')
    with open(teachers_file, 'w') as f:
        json.dump(teachers_data, f, indent=2)

    # Insert Teachers
    for td in teachers_data:
        u, _ = User.objects.get_or_create(
            registration_number=td['registration_number'],
            college=college,
            defaults={
                'first_name': td['first_name'], 'last_name': td['last_name'],
                'email': td['email'], 'role': UserRole.TEACHER
            }
        )
        u.set_password(td['password'])
        u.save()
        Teacher.objects.get_or_create(
            user=u, defaults={'department': td['department_name'], 'designation': td['designation']}
        )

    # 6. Generate Students Dataset
    students_data = []
    for i in range(1, 51):
        dept = random.choice(depts)
        year = random.choice([2023, 2024, 2025])
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        sem = (2026 - year) * 2 - 1
        students_data.append({
            "registration_number": f"GTU_S_{year}_{dept['code']}_{i:03d}",
            "password": "Student@123",
            "first_name": fn,
            "last_name": ln,
            "email": f"{fn.lower()}.{ln.lower()}{i}@gtu.edu",
            "department_code": dept['code'],
            "batch_name": str(year),
            "semester": sem
        })

    # Save to JSON
    students_file = os.path.join(data_dir, 'gtu_students.json')
    with open(students_file, 'w') as f:
        json.dump(students_data, f, indent=2)

    # Insert Students
    for sd in students_data:
        u, _ = User.objects.get_or_create(
            registration_number=sd['registration_number'],
            college=college,
            defaults={
                'first_name': sd['first_name'], 'last_name': sd['last_name'],
                'email': sd['email'], 'role': UserRole.STUDENT
            }
        )
        u.set_password(sd['password'])
        u.save()
        Student.objects.get_or_create(
            user=u, defaults={
                'department': department_objs[sd['department_code']],
                'batch': batches[int(sd['batch_name'])],
                'semester': sd['semester']
            }
        )

    print(f"College '{college_name}' created successfully with Admin ({admin_reg}).")
    print(f"Generated 3 Departments and 3 Batches.")
    print(f"Generated {len(teachers_data)} teachers and saved to {teachers_file}.")
    print(f"Generated {len(students_data)} students and saved to {students_file}.")

if __name__ == "__main__":
    main()
