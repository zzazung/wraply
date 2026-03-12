# Wraply User API Map

wraply-user가 사용하는 API 정의

---

# 프로젝트

POST /projects  
프로젝트 생성  

GET /projects  
프로젝트 목록 조회  

---

# 빌드

POST /projects/:projectId/builds  
빌드 시작  

GET /builds/:jobId  
빌드 상태 조회  

---

# Artifact

GET /:jobId/artifacts  
빌드 결과 조회  

응답 예시

{
  "items": [
    {
      "id": "artifact_abc123",
      "platform": "android",
      "size": 24567891,
      "downloadUrl": "https://cdn.wraply.app/downloads/android/job_123/app-release.apk",
      "createdAt": 1700000000000
    }
  ]
}

---

# 빌드 상태

queued  
running  
finished  
failed  

---

# 상태 표시

빌드 대기  
빌드 진행중  
빌드 완료  
빌드 실패  