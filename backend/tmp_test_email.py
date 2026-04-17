import requests
p={
  "result":{
    "student":{"name":"Test Student","email":"test@example.com","courseName":"B.Tech","semester":1,"academicYear":"2026-27"},
    "subjects":[{"name":"Math","maxMarks":100,"marksObtained":85},{"name":"Physics","maxMarks":100,"marksObtained":78}]
  },
  "email":"test@example.com",
  "subject":"Unit Test Result"
}
try:
    r = requests.post('http://127.0.0.1:5000/email-now', json=p, timeout=60)
    print('STATUS', r.status_code)
    print(r.text)
except Exception as e:
    print('EXCEPTION', e)
