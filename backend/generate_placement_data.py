"""
Generate Synthetic Placement Data
Creates companies, skills, jobs, and historical student applications for ML training.
"""
import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.academics.models import College, Student, Batch
from apps.placements.models import Company, JobPosting, Skill, JobSkill, StudentSkill, JobApplication

def generate_data():
    print("Starting placement data generation...")
    
    college = College.objects.first()
    if not college:
        print("Error: No college found. Run setup_initial_data first.")
        return

    # 1. Create Skills
    print("Creating Skills...")
    skill_names = [
        "Python", "Java", "C++", "React", "Node.js", "Django", "SQL", "MongoDB", 
        "Machine Learning", "Data Structures", "Algorithms", "AWS", "Docker"
    ]
    skills = {}
    for name in skill_names:
        skill, _ = Skill.objects.get_or_create(college=college, name=name)
        skills[name] = skill

    # 2. Create Companies
    print("Creating Companies...")
    companies_data = [
        ("Google", "Tier 1", "Search and AI"),
        ("Microsoft", "Tier 1", "Cloud and OS"),
        ("Amazon", "Tier 1", "E-commerce and AWS"),
        ("Atlassian", "Tier 1", "Software Tools"),
        ("Fintech Startup", "Tier 2", "Fast growing fintech"),
        ("Tech Innovators", "Tier 2", "Mid-sized IT services"),
        ("TCS", "Tier 3", "Mass recruiter"),
        ("Infosys", "Tier 3", "IT consulting"),
        ("Wipro", "Tier 3", "Global IT services")
    ]
    
    companies = []
    for name, tier, desc in companies_data:
        comp, _ = Company.objects.get_or_create(
            college=college, 
            name=name,
            defaults={'tier': tier, 'description': desc}
        )
        companies.append(comp)

    # 3. Create Job Postings
    print("Creating Job Postings...")
    jobs_data = [
        ("Software Engineering Intern", "INTERNSHIP", 7.5, 0),
        ("Full Stack Developer", "FULL_TIME", 7.0, 8.0),
        ("Backend Engineer", "FULL_TIME", 8.0, 15.0),
        ("Data Analyst Intern", "INTERNSHIP", 6.5, 0),
        ("Machine Learning Engineer", "FULL_TIME", 8.5, 20.0),
        ("Systems Engineer", "FULL_TIME", 6.0, 4.5), # Mass recruiter typical
    ]
    
    now = timezone.now()
    deadline_future = now + timedelta(days=30)
    deadline_past = now - timedelta(days=60)

    job_postings = []
    
    # Create active and historical jobs
    for i in range(15):
        comp = random.choice(companies)
        title, jtype, min_gpa, ctc = random.choice(jobs_data)
        
        is_active = random.choice([True, False])
        deadline = deadline_future if is_active else deadline_past
        
        job, created = JobPosting.objects.get_or_create(
            college=college,
            company=comp,
            title=f"{title} - {now.year if is_active else now.year-1}",
            defaults={
                'description': f"Looking for excellent candidates for {title} role.",
                'job_type': jtype,
                'min_gpa': min_gpa,
                'ctc': ctc if jtype == "FULL_TIME" else None,
                'is_active': is_active,
                'deadline': deadline
            }
        )
        if not created:
            continue
            
        job_postings.append(job)
        
        # Assign 2-4 skills to the job
        job_skills_to_add = random.sample(list(skills.values()), random.randint(2, 4))
        for sk in job_skills_to_add:
            JobSkill.objects.create(college=college, job=job, skill=sk)

    # 4. Assign Skills and Applications to Students
    print("Assigning skills to students and generating applications...")
    students = Student.objects.filter(user__college=college)
    
    for student in students:
        # Give student 2-5 skills
        student_skills_to_add = random.sample(list(skills.values()), random.randint(2, 5))
        for sk in student_skills_to_add:
            StudentSkill.objects.get_or_create(
                college=college, 
                student=student, 
                skill=sk,
                defaults={'proficiency': random.randint(2, 5)}
            )
            
        # If student is in older batch (2023 or 2024), they should have applications
        if student.batch.year in [2023, 2024]:
            # Apply to 1-4 jobs
            jobs_applied = random.sample(job_postings, random.randint(1, 4))
            
            # Decide if this student gets placed based on their skills/luck
            got_offer = random.random() < 0.3 # 30% chance of overall placement per job roughly
            
            for i, job in enumerate(jobs_applied):
                # Status progression
                status = 'REJECTED'
                if got_offer and i == 0:
                    status = 'OFFERED'
                elif random.random() < 0.4:
                    status = 'INTERVIEWED'
                elif random.random() < 0.6:
                    status = 'SHORTLISTED'
                    
                JobApplication.objects.create(
                    college=college,
                    job=job,
                    student=student,
                    status=status
                )

    print(f"Generated:")
    print(f"  {Skill.objects.filter(college=college).count()} Skills")
    print(f"  {Company.objects.filter(college=college).count()} Companies")
    print(f"  {JobPosting.objects.filter(college=college).count()} Job Postings")
    print(f"  {JobApplication.objects.filter(college=college).count()} Job Applications")
    print("Done!")

if __name__ == "__main__":
    generate_data()
