
import requests
import json
import sys
import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"

def login(reg_no, password, college_code='IITB'):
    url = f"{BASE_URL}/auth/login/"
    payload = {
        "registration_number": reg_no,
        "password": password,
        "college_code": college_code
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"❌ Login failed for {reg_no}: {e.response.text}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Login Error: {e}")
        sys.exit(1)

def main():
    print("🚀 Starting Assessments E2E Test\n")

    # 1. Login as Teacher
    print("🔹 Logging in as Teacher (T001)...")
    teacher_auth = login("T001", "password123")
    teacher_token = teacher_auth['access']
    print("✅ Teacher Logged In\n")

    # 2. Login as Student
    print("🔹 Logging in as Student (S001)...")
    student_auth = login("S001", "password123")
    student_token = student_auth['access']
    print("✅ Student Logged In\n")

    # Headers
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 3. Get Subject ID (Data Structures - CS101)
    # We assume ID 1 as per setup
    subject_id = 1 
    
    # 4. Create Assessment (Unit Test 1)
    print(f"🔹 Creating Assessment for Subject {subject_id}...")
    today = datetime.date.today().isoformat()
    
    assessment_payload = {
        "subject": subject_id,
        "name": "Unit Test 1",
        "assessment_type": "INTERNAL_1",
        "max_marks": 50.00,
        "weightage": 10.00,
        "date": today
    }
    
    assessment_id = None
    
    response = requests.post(
        f"{BASE_URL}/assessments/tests/", 
        json=assessment_payload, 
        headers=teacher_headers
    )
    
    if response.status_code == 201:
        print("✅ Assessment Created")
        data = response.json()
        assessment_id = data['id']
    elif response.status_code == 400 and "already exists" in response.text:
         print("ℹ️ Assessment already exists, fetching existing...")
         # Fetch assessments
         resp = requests.get(f"{BASE_URL}/assessments/tests/?subject={subject_id}", headers=teacher_headers)
         if resp.status_code == 200:
             assessments = resp.json()['results']
             for a in assessments:
                 if a['name'] == "Unit Test 1":
                     assessment_id = a['id']
                     break
    else:
        print(f"❌ Failed to create assessment: {response.text}")
        sys.exit(1)

    if not assessment_id:
        print("❌ Could not get Assessment ID")
        sys.exit(1)
        
    print(f"👉 Assessment ID: {assessment_id}\n")

    # 5. Add Marks for Student (S001)
    print("🔹 Adding Marks for Student...")
    
    # We need Student Profile ID. 
    # Ideally we get this from an endpoint, but for this test we know:
    # Student S001 usually has User ID 3 (1=Admin, 2=Teacher, 3=Student) and Profile ID 1?
    # Let's try fetching the student profile first or just use a known ID if deterministic.
    # A robust way: Teacher views enrollment?
    # Or simplified: We just use the ID we saw in Attendance test logs? (ID: 1 was Profile ID for S001 in attendance record)
    student_profile_id = 1
    
    marks_payload = {
        "assessment_id": assessment_id,
        "marks": [
            {
                "student_id": student_profile_id, 
                "marks": 42.5,
                "remarks": "Good job"
            }
        ]
    }
    
    resp = requests.post(
        f"{BASE_URL}/assessments/marks/update-bulk/",
        json=marks_payload,
        headers=teacher_headers
    )
    
    if resp.status_code == 200:
        print("✅ Marks Added Successfully")
    else:
        print(f"❌ Failed to add marks: {resp.text}")
        sys.exit(1)

    # 6. Verify as Student
    print("\n🔹 Verifying as Student...")
    resp = requests.get(f"{BASE_URL}/assessments/marks/", headers=student_headers)
    
    if resp.status_code == 200:
        my_marks = resp.json()['results']
        # Filter by assessment
        my_mark = next((m for m in my_marks if m['assessment'] == assessment_id), None)
        if my_mark:
            print(f"✅ Student sees marks: {my_mark['marks_obtained']}/{50.0}")
            if float(my_mark['marks_obtained']) == 42.5:
                print("🎉 SUCCESS: Assessment flow verified!")
            else:
                print(f"❌ Mismatch: Expected 42.5, got {my_mark['marks_obtained']}")
        else:
            print("❌ Student cannot find their marks")
    else:
         print(f"❌ Student failed to fetch marks: {resp.text}")

if __name__ == "__main__":
    main()
