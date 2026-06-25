import urllib.request
import json
try:
    r = urllib.request.urlopen('http://127.0.0.1:8000/api/v1/auth/users/?page_size=1000')
    data = json.loads(r.read())
    print("Count:", data.get("count"))
    print("Results length:", len(data.get("results", [])))
except Exception as e:
    print("Error:", e)
