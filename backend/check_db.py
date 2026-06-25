import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.users.models import User
print('Users:', User.objects.count())
print('Teachers:', User.objects.filter(role='TEACHER').count())
