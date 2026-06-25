import os, django, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.academics.models import College, Student, Batch, Department

college = College.objects.first()
file_path = r'C:\Users\Sayan\Documents\spms\datafolder\students_100.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

created_users = 0
updated_users = 0
created_students = 0
updated_students = 0
errors = []

for e in data:
    reg_no = e.get('registration_number')
    if not reg_no:
        errors.append(f"Missing registration_number in {e}")
        continue
        
    batch_name = e.get('batch_name')
    dept_code = e.get('department_code')
    
    # Try to find the batch
    batch = None
    if batch_name:
        batch = Batch.objects.filter(name=batch_name, college=college).first()
        if not batch and str(batch_name).isdigit():
            batch = Batch.objects.filter(year=int(batch_name), college=college).first()
        if not batch:
            batch = Batch.objects.filter(name=f"Batch {batch_name}", college=college).first()
        
    # Try to find the department
    department = None
    if dept_code:
        # Search global departments first
        department = Department.objects.filter(code=dept_code, college=college).first()
        
    if not batch:
        errors.append(f"Could not find batch '{batch_name}' for {reg_no}")
        continue
    if not department:
        errors.append(f"Could not find department '{dept_code}' for {reg_no}")
        continue

    # Create User
    u, u_created = User.objects.get_or_create(
        registration_number=reg_no,
        defaults={
            'first_name': e.get('first_name', ''),
            'last_name': e.get('last_name', ''),
            'email': e.get('email', ''),
            'phone_number': e.get('phone_number', ''),
            'role': 'STUDENT',
            'college': college,
            'must_change_password': e.get('must_change_password', False),
            'is_active': e.get('is_active', True)
        }
    )
    if u_created:
        u.set_password(e.get('password', 'Student@123'))
        u.save()
        created_users += 1
    else:
        updated_users += 1
        
    # Create Student profile
    s, s_created = Student.objects.update_or_create(
        user=u,
        defaults={
            'batch': batch,
            'department': department,
            'semester': int(e.get('semester', 1))
        }
    )
    if s_created:
        created_students += 1
    else:
        updated_students += 1

print(f"Import Summary:")
print(f"  Users created: {created_users}")
print(f"  Users updated: {updated_users}")
print(f"  Students created: {created_students}")
print(f"  Students updated: {updated_students}")
if errors:
    print(f"  Errors: {len(errors)}")
    for err in errors[:5]:
        print(f"    {err}")
    if len(errors) > 5:
        print(f"    ...and {len(errors)-5} more errors")
