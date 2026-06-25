import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.users.models import User
from apps.academics.models import College

admin_users = User.objects.filter(role='ADMIN')
print("Admins:")
for a in admin_users:
    print(f"  {a.registration_number}: College {a.college_id}")

teachers = User.objects.filter(role='TEACHER')
college_counts = {}
for t in teachers:
    college_counts[t.college_id] = college_counts.get(t.college_id, 0) + 1
print("Teachers by College ID:")
for cid, count in college_counts.items():
    print(f"  College {cid}: {count} teachers")
