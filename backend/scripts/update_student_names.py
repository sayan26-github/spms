import os
import sys
import random

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.db import transaction
from apps.academics.models import Student
from apps.users.models import User

# Hardcoded realistic Indian names
FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharv", "Ananya", "Diya", "Avni", "Saanvi", "Priya", "Neha", "Riya", "Kavya",
    "Rahul", "Rohan", "Vikram", "Siddharth", "Karan", "Kunal", "Sneha", "Pooja", "Aarti", "Divya",
    "Rishabh", "Aryan", "Abhinav", "Tushar", "Harsh", "Shruti", "Megha", "Shreya", "Nikita", "Anjali",
    "Kartik", "Pranav", "Nikhil", "Gaurav", "Saurabh", "Rachna", "Payal", "Kriti", "Nisha", "Tanvi"
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Malhotra", "Bhatia", "Chawla", "Mehra", "Kapur", "Singh", "Yadav",
    "Patel", "Shah", "Desai", "Parekh", "Mehta", "Iyer", "Nair", "Pillai", "Reddy", "Rao",
    "Joshi", "Kulkarni", "Deshmukh", "Choudhary", "Jain", "Agarwal", "Mishra", "Pandey", "Shukla", "Dubey",
    "Das", "Bose", "Chatterjee", "Banerjee", "Sengupta", "Mukherjee", "Ghosh", "Datta", "Nandi", "Saha"
]

def run():
    print("Starting Safe Student Renaming...")
    
    with transaction.atomic():
        students = Student.objects.select_related('user').all()
        count = 0
        
        for student in students:
            # We only want to update the auto-generated students (Student 1, Student 2, etc.)
            if student.user.first_name == "Student":
                f_name = random.choice(FIRST_NAMES)
                l_name = random.choice(LAST_NAMES)
                
                # Update user fields
                student.user.first_name = f_name
                student.user.last_name = l_name
                
                # Update email to match new name (e.g., aarav.sharma.s001@dce.edu)
                # Ensure it's lowercase and clean
                reg_no = student.user.registration_number.lower()
                student.user.email = f"{f_name.lower()}.{l_name.lower()}.{reg_no}@dce.edu"
                student.user.save()
                
                # Update student bio
                student.bio = f"Hi, I'm {f_name} {l_name}."
                student.save()
                
                count += 1
                
        print(f"Successfully renamed {count} students!")

if __name__ == "__main__":
    run()
