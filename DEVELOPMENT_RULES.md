# Wraply Development Rules

Wraply 프로젝트의 코드 일관성과 안정적인 개발을 유지하기 위한 규칙이다.

---

# 1. 원본 소스코드 기준 원칙

기존 소스코드 구조는 절대 변경하지 않는다.

금지

- 기존 파일 삭제
- 파일 이동
- 기존 코드 전체 교체

허용

- 기존 파일 내부 기능 추가
- 버그 수정

---

# 2. 변수명 / 함수명 변경 금지

기존 코드에서 사용되는 변수명과 함수명은 변경하지 않는다.

예

enqueueBuild()

다음 변경 금지

queueBuild()
createBuild()

---

# 3. 코드 스타일

Wraply는 다음 규칙을 따른다.

- JavaScript
- CommonJS
- 세미콜론 사용

예

const express = require("express");

---

# 4. 코드 변경 시 Full Code 제공

코드 변경 시 반드시 **전체 파일 코드**를 제공한다.

부분 코드 수정 금지.

---

# 5. 코드 변경 시 테스트 코드 작성

모든 기능 수정 시 테스트 코드를 작성한다.

tests 디렉토리 사용

---

# 6. API Response Format

성공

{
  "success": true,
  "data": {}
}

실패

{
  "error": "message"
}

---

# 7. DB 접근 규칙

직접 DB 접근 금지

사용

@wraply/shared/db

예

const { query } = require("@wraply/shared/db");

---

# 8. Job Status

다음 상태만 사용한다.

queued  
preparing  
patching  
building  
signing  
uploading  
finished  
failed

---

# 9. Monorepo 규칙

공통 모듈은 shared 패키지에 위치한다.

wraply-shared

---

# 10. Worker → API 의존성 금지

worker에서 api 코드 import 금지.

허용

@wraply/shared