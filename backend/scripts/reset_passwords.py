
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def reset_passwords():
    print("🔄 Resetting passwords for all test users...\n")
    
    users_to_fix = ['ADMIN001', 'T001', 'S001']
    
    for reg_no in users_to_fix:
        try:
            # We filter by registration number as that is our stable identifier
            users = User.objects.filter(registration_number=reg_no)
            
            if not users.exists():
                print(f"❌ User {reg_no} not found!")
                continue
                
            for user in users:
                print(f"👤 Found User: {user.username} (Reg: {user.registration_number})")
                print(f"   - is_staff: {user.is_staff}")
                print(f"   - is_superuser: {user.is_superuser}")
                print(f"   - is_active: {user.is_active}")
                
                user.set_password('password123')
                user.save()
                print(f"   ✅ Password reset to: password123\n")
                
        except Exception as e:
            print(f"❌ Error updating {reg_no}: {e}")

if __name__ == '__main__':
    reset_passwords()
