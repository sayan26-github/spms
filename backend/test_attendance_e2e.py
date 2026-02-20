
import requests
import json
import sys

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
    print("🚀 Starting Attendance E2E Test\n")

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

    # 3. Get Subject ID (Data Structures)
    # We assume we know the subject ID or fetch it. T001 is teacher of CS101.
    # Let's try to fetch subjects taught by teacher.
    # Actually, we don't have a direct endpoint to list subjects easily in this script without more code.
    # Let's assume Subject ID 1 (since we just created it and it's likely the first one or we can query DB from script permissions? no).
    # We will try ID 1. If not, we might need to expose an endpoint or just guess.
    subject_id = 1 
    
    # 4. Create Class Session
    print(f"🔹 Creating Class Session for Subject {subject_id}...")
    import datetime
    today = datetime.date.today().isoformat()
    
    session_payload = {
        "subject": subject_id,
        "date": today,
        "topic": "Introduction to Linked Lists"
    }
    
    # Check if session already exists (to avoid error)
    # But for now, let's just try to create. 
    # If it fails with "already exists", we fetch it.
    
    session_id = None
    
    response = requests.post(
        f"{BASE_URL}/attendance/sessions/", 
        json=session_payload, 
        headers=teacher_headers
    )
    
    if response.status_code == 201:
        print("✅ Session Created")
        session_data = response.json()
        session_id = session_data['id']
    elif response.status_code == 400 and "already exists" in response.text:
         print("ℹ️ Session already exists, fetching existing...")
         # Fetch sessions
         resp = requests.get(f"{BASE_URL}/attendance/sessions/?subject={subject_id}", headers=teacher_headers)
         if resp.status_code == 200:
             sessions = resp.json()['results']
             # Find today's session
             for s in sessions:
                 if s['date'] == today:
                     session_id = s['id']
                     break
    else:
        print(f"❌ Failed to create session: {response.text}")
        sys.exit(1)

    if not session_id:
        print("❌ Could not get Session ID")
        sys.exit(1)
        
    print(f"👉 Session ID: {session_id}\n")

    # 5. Check Initial Attendance Status
    print("🔹 Checking Attendance Records (Should be ABSENT by default)...")
    resp = requests.get(f"{BASE_URL}/attendance/records/?class_session={session_id}", headers=teacher_headers)
    if resp.status_code == 200:
        records = resp.json()['results']
        student_record = next((r for r in records if r['registration_number'] == 'S001'), None)
        if student_record:
            print(f"✅ Found Student Record: {student_record['status']}")
            if student_record['status'] == 'ABSENT':
                print("✅ Status is correctly defaulted to ABSENT")
            else:
                print(f"⚠️ Unexpected status: {student_record['status']}")
                # We will update it anyway
        else:
             print("❌ Student record not found in session!")
             print(f"Records found: {len(records)}")
             # sys.exit(1)
    else:
        print(f"❌ Failed to fetch records: {resp.text}")

    # 6. Mark Attendance (Present)
    print("\n🔹 Marking Student as PRESENT...")
    # We need Student ID (User ID? No, Student Profile ID or User ID? 
    # The Serializer expects 'student_id'. In `Attendance` model, `student` is ForeignKey to `Student` profile.
    # But typically frontend sends ID. 
    # Let's check `BulkAttendanceUpdateSerializer`: `student_id = serializers.IntegerField()`
    # And `AttendanceService.update_attendance` uses `student_id` to filter `Attendance` objects?
    # No, `Attendance.objects.update_or_create(class_session=session, student_id=student_id, ...)`
    # So it expects the Primary Key of `Student` model (profile), NOT `User` model.
    # We need to retrieve `Student` ID. 
    # In step 5, `student_record` contains 'student' field which is the ID! 
    
    if 'student_record' in locals() and student_record:
        student_profile_id = student_record['student']
        
        update_payload = {
            "session_id": session_id,
            "attendance": [
                {"student_id": student_profile_id, "status": "PRESENT"}
            ]
        }
        
        resp = requests.post(
            f"{BASE_URL}/attendance/records/update-bulk/",
            json=update_payload,
            headers=teacher_headers
        )
        
        if resp.status_code == 200:
            print("✅ Attendance Marked Successfully")
        else:
            print(f"❌ Failed to mark attendance: {resp.text}")
            sys.exit(1)
            
    # 7. Verify as Student
    print("\n🔹 Verifying as Student...")
    resp = requests.get(f"{BASE_URL}/attendance/records/", headers=student_headers)
    if resp.status_code == 200:
        my_records = resp.json()['results']
        # Filter by session
        my_record = next((r for r in my_records if r['class_session'] == session_id), None)
        if my_record:
            print(f"✅ Student sees record: {my_record['status']}")
            if my_record['status'] == 'PRESENT':
                print("🎉 SUCCESS: Attendance flow verified!")
            else:
                print(f"❌ Mismatch: Expected PRESENT, got {my_record['status']}")
        else:
            print("❌ Student cannot find their attendance record")
    else:
         print(f"❌ Student failed to fetch records: {resp.text}")

if __name__ == "__main__":
    main()
