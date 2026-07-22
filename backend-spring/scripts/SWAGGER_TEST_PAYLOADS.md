# CertificationHub — Swagger API Test Payloads

> Copy-paste these payloads directly into Swagger UI (`http://localhost:8080/swagger-ui.html`)
> 
> **⚠️ IMPORTANT**: You must first login to get a Bearer token, then click "Authorize" in Swagger and paste it.

---

## Seed Data IDs (from V3)

| Entity | ID | Notes |
|--------|----|-------|
| Admin | `f1111111-1111-1111-1111-111111111111` | admin@devoteam.com |
| Career Manager | `f2222222-2222-2222-2222-222222222222` | cm@devoteam.com |
| Squad Lead | `f3333333-3333-3333-3333-333333333333` | lead@devoteam.com (Java Squad) |
| Collaborator | `f4444444-4444-4444-4444-444444444444` | collab@devoteam.com (Java Squad) |
| Other User | `f9999999-9999-9999-9999-999999999999` | other@devoteam.com (no squad) |
| .NET Squad | `a0000000-0000-0000-0000-000000000001` | |
| Java Squad | `a0000000-0000-0000-0000-000000000002` | |
| DevOps Squad | `a0000000-0000-0000-0000-000000000003` | |
| AZ-900 | `c0000000-0000-0000-0000-000000000001` | Foundational / Microsoft |
| AZ-204 | `c0000000-0000-0000-0000-000000000002` | Intermediate / Microsoft |
| CKA | `c0000000-0000-0000-0000-000000000005` | Advanced / CNCF |
| Clean Code Training | `e0000000-0000-0000-0000-000000000001` | UDEMY_BUSINESS |
| DevSecOps Training | `e0000000-0000-0000-0000-000000000002` | INTERNAL |
| Assignment 1 (Collab->AZ-204) | `b0000000-0000-0000-0000-000000000001` | IN_PROGRESS |
| Assignment 2 (Lead->CKA) | `b0000000-0000-0000-0000-000000000002` | PLANNED |
| Assignment 3 (Other->AZ-900) | `b0000000-0000-0000-0000-000000000003` | COMPLETED |

---

## 1. AUTH — /api/v1/auth

### 1.1 POST /api/v1/auth/login — Login ADMIN
```json
{
  "email": "admin@devoteam.com",
  "password": "Password123!"
}
```
Expected: 200 — Copy the accessToken and use it in Swagger "Authorize" button.

### 1.2 POST /api/v1/auth/login — Login Career Manager
```json
{
  "email": "cm@devoteam.com",
  "password": "Password123!"
}
```

### 1.3 POST /api/v1/auth/login — Login Squad Lead
```json
{
  "email": "lead@devoteam.com",
  "password": "Password123!"
}
```

### 1.4 POST /api/v1/auth/login — Login Collaborator
```json
{
  "email": "collab@devoteam.com",
  "password": "Password123!"
}
```

### 1.5 POST /api/v1/auth/login — Wrong password (expect 401)
```json
{
  "email": "admin@devoteam.com",
  "password": "WrongPassword123!"
}
```

### 1.6 POST /api/v1/auth/login — Non-existent email (expect 401)
```json
{
  "email": "nobody@devoteam.com",
  "password": "Password123!"
}
```

### 1.7 POST /api/v1/auth/login — Empty email validation (expect 400)
```json
{
  "email": "",
  "password": "Password123!"
}
```

### 1.8 POST /api/v1/auth/refresh — Refresh token
```json
{
  "refreshToken": "<paste_refresh_token_from_login>"
}
```
Expected: 200 — Verify the new accessToken preserves the user's role (Bug 8 fix).

### 1.9 POST /api/v1/auth/logout — Logout
No body needed. Must be authenticated.
Expected: 200

---

## 2. USERS — /api/v1/users

### 2.1 GET /api/v1/users — List users
As ADMIN: Returns ALL users.
As CM: Returns only managed collaborators + self.
As SQUAD_LEAD: Returns squad members + self.
As COLLABORATOR: Returns only self.

Query params to test:
- ?role=ADMIN
- ?squadId=a0000000-0000-0000-0000-000000000002
- ?status=ACTIVE
- ?search=admin

### 2.2 POST /api/v1/users — Create COLLABORATOR (as ADMIN)
```json
{
  "email": "new.collab@devoteam.com",
  "password": "Password123!",
  "firstName": "New",
  "lastName": "Collaborator",
  "role": "COLLABORATOR",
  "squadId": "a0000000-0000-0000-0000-000000000002",
  "hireDate": "2025-01-15"
}
```
Expected: 201

### 2.3 POST /api/v1/users — Create TRAINING_MANAGER (as ADMIN)
```json
{
  "email": "tm@devoteam.com",
  "password": "Password123!",
  "firstName": "Training",
  "lastName": "Manager",
  "role": "TRAINING_MANAGER",
  "hireDate": "2024-06-01"
}
```
Expected: 201

### 2.4 POST /api/v1/users — Create DIRECTOR (as ADMIN)
```json
{
  "email": "director@devoteam.com",
  "password": "Password123!",
  "firstName": "Test",
  "lastName": "Director",
  "role": "DIRECTOR",
  "hireDate": "2023-03-10"
}
```
Expected: 201

### 2.5 POST /api/v1/users — COLLABORATOR without squad (expect 400)
```json
{
  "email": "no.squad@devoteam.com",
  "password": "Password123!",
  "firstName": "No",
  "lastName": "Squad",
  "role": "COLLABORATOR",
  "hireDate": "2025-01-01"
}
```

### 2.6 POST /api/v1/users — Duplicate email (expect 409)
```json
{
  "email": "admin@devoteam.com",
  "password": "Password123!",
  "firstName": "Duplicate",
  "lastName": "Test",
  "role": "ADMIN",
  "hireDate": "2025-01-01"
}
```

### 2.7 POST /api/v1/users — Invalid email + weak password (expect 400)
```json
{
  "email": "not-an-email",
  "password": "weak",
  "firstName": "",
  "lastName": "",
  "role": "ADMIN",
  "hireDate": "2025-01-01"
}
```

### 2.8 POST /api/v1/users — As COLLABORATOR (expect 403)
Use COLLABORATOR token. Same valid payload as 2.2.
Expected: 403 — Only ADMIN can create users.

### 2.9 PUT /api/v1/users/f4444444-4444-4444-4444-444444444444 — ADMIN updates user
```json
{
  "firstName": "Jean-Updated",
  "lastName": "Collaborateur",
  "phone": "+212612345678",
  "hireDate": "2024-06-15"
}
```
Expected: 200

### 2.10 PUT /api/v1/users/f4444444-4444-4444-4444-444444444444 — COLLABORATOR updates own profile
Use COLLABORATOR token:
```json
{
  "firstName": "Jean",
  "lastName": "Collaborateur",
  "phone": "+212699999999"
}
```
Expected: 200

### 2.11 PUT /api/v1/users/f1111111-1111-1111-1111-111111111111 — COLLABORATOR updates another user (expect 403)
Use COLLABORATOR token:
```json
{
  "firstName": "Hacked",
  "lastName": "Admin"
}
```
Expected: 403

### 2.12 DELETE /api/v1/users/{new_user_id} — ADMIN deletes user
Use ID from test 2.2. Expected: 204

### 2.13 DELETE /api/v1/users/f1111111-1111-1111-1111-111111111111 — As COLLABORATOR (expect 403)

### 2.14 POST /api/v1/users/change-password — Change password
```json
{
  "oldPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

---

## 3. CERTIFICATIONS — /api/v1/certifications

### 3.1 GET /api/v1/certifications — List all
Query params: ?provider=Microsoft, ?difficulty=FOUNDATIONAL, ?priority=MANDATORY, ?search=Azure

### 3.2 GET /api/v1/certifications/c0000000-0000-0000-0000-000000000001 — Get AZ-900 details

### 3.3 GET /api/v1/certifications/00000000-0000-0000-0000-000000000000 — Non-existent (404)

### 3.4 POST /api/v1/certifications — Create (as ADMIN or TRAINING_MANAGER)
```json
{
  "code": "GCP-ACE",
  "name": "Google Cloud Associate Cloud Engineer",
  "provider": "Google",
  "difficulty": "INTERMEDIATE",
  "priority": "HIGH",
  "examCostUsd": 200.00,
  "validityMonths": 24,
  "officialUrl": "https://cloud.google.com/certification/cloud-engineer",
  "squads": [
    {
      "squadId": "a0000000-0000-0000-0000-000000000002",
      "priority": 3
    }
  ]
}
```
Expected: 201

### 3.5 POST /api/v1/certifications — As COLLABORATOR (expect 403)
Same payload as 3.4, COLLABORATOR token.

### 3.6 POST /api/v1/certifications — As CAREER_MANAGER (expect 403)
Same payload as 3.4, CM token.

### 3.7 PUT /api/v1/certifications/{id} — Update (as ADMIN)
Use ID from 3.4:
```json
{
  "code": "GCP-ACE",
  "name": "GCP Associate Cloud Engineer (Updated)",
  "provider": "Google Cloud",
  "difficulty": "ADVANCED",
  "priority": "MANDATORY",
  "examCostUsd": 300.00,
  "validityMonths": 36,
  "squads": []
}
```

### 3.8 DELETE /api/v1/certifications/{id} — Delete (as ADMIN)
Use ID from 3.4. Expected: 204

---

## 4. TRAININGS — /api/v1/trainings

### 4.1 GET /api/v1/trainings — List all
Query params: ?type=UDEMY_BUSINESS, ?type=INTERNAL, ?priority=MANDATORY, ?search=Clean

### 4.2 GET /api/v1/trainings/e0000000-0000-0000-0000-000000000001 — Get details

### 4.3 POST /api/v1/trainings — Create (as ADMIN or TRAINING_MANAGER)
```json
{
  "title": "Docker & Kubernetes Mastery",
  "type": "EXTERNAL",
  "provider": "Udemy",
  "priority": "MANDATORY",
  "description": "Full hands-on course",
  "language": "EN",
  "durationHours": 25.5,
  "costUsd": 12.99,
  "url": "https://udemy.com/docker-k8s",
  "squads": [
    {
      "squadId": "a0000000-0000-0000-0000-000000000003",
      "priority": 1
    }
  ]
}
```
Expected: 201

### 4.4 POST /api/v1/trainings — As COLLABORATOR (expect 403)

### 4.5 PUT /api/v1/trainings/{id} — Update (use ID from 4.3)
```json
{
  "title": "Docker & Kubernetes Mastery v2",
  "type": "EXTERNAL",
  "provider": "Udemy",
  "priority": "OPTIONAL",
  "durationHours": 30,
  "squads": []
}
```

### 4.6 DELETE /api/v1/trainings/{id} — Delete (as ADMIN). Expected: 204

---

## 5. ASSIGNMENTS — /api/v1/assignments

### 5.1 GET /api/v1/assignments — List (RLS per role)
Query params: ?itemType=CERTIFICATION, ?status=IN_PROGRESS, ?userId=f4444444-4444-4444-4444-444444444444

Test with each role:
- ADMIN: sees all 3 assignments
- CM: sees only assignment 1 (manages the collaborator)
- SQUAD_LEAD: sees assignments 1 and 2 (Java Squad members)
- COLLABORATOR: sees only assignment 1 (own)

### 5.2 POST /api/v1/assignments — Create certification assignment (as ADMIN)
```json
{
  "itemType": "CERTIFICATION",
  "itemId": "c0000000-0000-0000-0000-000000000003",
  "userId": "f4444444-4444-4444-4444-444444444444",
  "notes": "AWS Cloud Practitioner assigned by admin"
}
```
Expected: 201

### 5.3 POST /api/v1/assignments — Create training assignment (as ADMIN)
```json
{
  "itemType": "TRAINING",
  "itemId": "e0000000-0000-0000-0000-000000000001",
  "userId": "f3333333-3333-3333-3333-333333333333",
  "notes": "Clean Code for the lead"
}
```
Expected: 201

### 5.4 POST /api/v1/assignments — CM creates for managed collab
Use CAREER_MANAGER token:
```json
{
  "itemType": "CERTIFICATION",
  "itemId": "c0000000-0000-0000-0000-000000000009",
  "userId": "f4444444-4444-4444-4444-444444444444",
  "notes": "PSM-I assigned by career manager"
}
```
Expected: 201

### 5.5 POST /api/v1/assignments — CM assigns to unmanaged user (expect 403)
Use CAREER_MANAGER token:
```json
{
  "itemType": "CERTIFICATION",
  "itemId": "c0000000-0000-0000-0000-000000000001",
  "userId": "f9999999-9999-9999-9999-999999999999"
}
```

### 5.6 POST /api/v1/assignments — SQUAD_LEAD cannot create (expect 403)
Use SQUAD_LEAD token, same payload as 5.2.

### 5.7 PUT /api/v1/assignments/{id} — Approve (PENDING -> APPROVED)
Use new ID from 5.2:
```json
{
  "statusCertification": "APPROVED"
}
```

### 5.8 PUT /api/v1/assignments/{id} — Schedule exam (APPROVED -> EXAM_SCHEDULED)
Same assignment:
```json
{
  "statusCertification": "EXAM_SCHEDULED",
  "examAt": "2026-09-15T09:00:00Z"
}
```

### 5.9 PUT /api/v1/assignments/b0000000-0000-0000-0000-000000000001 — Invalid transition (expect 409)
Assignment 1 is IN_PROGRESS, trying to skip to COMPLETED:
```json
{
  "statusCertification": "COMPLETED"
}
```

### 5.10 PUT /api/v1/assignments/{id} — Training workflow
Use new ID from 5.3:

Step 1 - Approve:
```json
{
  "statusTraining": "APPROVED"
}
```

Step 2 - Plan:
```json
{
  "statusTraining": "PLANNED"
}
```

Step 3 - Start:
```json
{
  "statusTraining": "IN_PROGRESS",
  "trainingProgressPercentage": 25
}
```

Step 4 - Update progress:
```json
{
  "statusTraining": "IN_PROGRESS",
  "trainingProgressPercentage": 75,
  "notes": "Almost done with the training"
}
```

---

## 6. CERTIFICATE UPLOAD — /api/v1/assignments/{id}/upload-certificate

### 6.1 POST /api/v1/assignments/b0000000-0000-0000-0000-000000000001/upload-certificate
Use multipart/form-data in Swagger. Field name: file. Attach a PDF. Use COLLABORATOR token.
Expected: 201

---

## 7. CERTIFICATE DOWNLOAD — /api/v1/certificates

### 7.1 GET /api/v1/certificates/{id}/download
Use ID returned from upload. Expected: 200 (PDF)

### 7.2 GET /api/v1/certificates/00000000-0000-0000-0000-000000000000/download
Expected: 404

---

## 8. CERTIFICATION RATINGS — /api/v1/certifications/{certId}/ratings

### 8.1 GET /api/v1/certifications/c0000000-0000-0000-0000-000000000002/ratings
Expected: 200

### 8.2 POST /api/v1/certifications/c0000000-0000-0000-0000-000000000002/ratings — Not completed (403)
Use COLLABORATOR token (has AZ-204 IN_PROGRESS, not COMPLETED):
```json
{
  "rating": 5,
  "comment": "Should fail - not completed yet",
  "wouldRecommend": true
}
```

### 8.3 POST /api/v1/certifications/c0000000-0000-0000-0000-000000000001/ratings — ADMIN cannot rate (403)
```json
{
  "rating": 4,
  "comment": "Admin should not be able to rate",
  "wouldRecommend": true
}
```

### 8.4 POST /api/v1/certifications/c0000000-0000-0000-0000-000000000001/ratings — Valid rating
Login as other@devoteam.com (has AZ-900 COMPLETED):
```json
{
  "rating": 4,
  "comment": "Good foundational cert, well structured exam",
  "wouldRecommend": true,
  "difficulty": 2,
  "materialsQuality": 4,
  "usefulness": 5
}
```
Expected: 201

### 8.5 POST /api/v1/certifications/c0000000-0000-0000-0000-000000000001/ratings/f9999999-9999-9999-9999-999999999999/report
No body needed. Expected: 202

---

## 9. MANAGER ASSIGNMENTS — /api/v1/manager-assignments

### 9.1 GET /api/v1/manager-assignments/hierarchy — ADMIN only
Expected: 200

### 9.2 GET /api/v1/manager-assignments/hierarchy — As COLLABORATOR (expect 403)

### 9.3 GET /api/v1/manager-assignments/f2222222-2222-2222-2222-222222222222/collaborators
Expected: 200

### 9.4 POST /api/v1/manager-assignments — Assign (ADMIN only)
```json
{
  "managerId": "f2222222-2222-2222-2222-222222222222",
  "collaboratorId": "f3333333-3333-3333-3333-333333333333"
}
```
Expected: 201

### 9.5 POST /api/v1/manager-assignments — As CM (expect 403)
Use CM token, same payload.

### 9.6 DELETE /api/v1/manager-assignments/f2222222-2222-2222-2222-222222222222/f3333333-3333-3333-3333-333333333333
Expected: 204

---

## 10. NOTIFICATIONS — /api/v1/notifications

### 10.1 GET /api/v1/notifications — Get my notifications
Expected: 200

### 10.2 PUT /api/v1/notifications/{id}/read — Mark as read
Use ID from 10.1. Expected: 204

---

## Workflow State Machine Reference

### Certification Statuses
PENDING_APPROVAL -> APPROVED -> PLANNED -> IN_PROGRESS -> EXAM_SCHEDULED -> COMPLETED
                 -> REJECTED                                             -> FAILED
                                                    Any -> CANCELLED
                                              COMPLETED -> EXPIRED

### Training Statuses
PENDING_APPROVAL -> APPROVED -> PLANNED -> IN_PROGRESS -> COMPLETED
                 -> REJECTED              Any -> CANCELLED

### User Roles and Permissions

| Permission | ADMIN | DIRECTOR | TRAINING_MGR | CAREER_MGR | SQUAD_LEAD | COLLABORATOR |
|-----------|-------|----------|-------------|-----------|-----------|-------------|
| Create users | Yes | No | No | No | No | No |
| Delete users | Yes | No | No | No | No | No |
| Create cert/training | Yes | No | Yes | No | No | No |
| Create assignment | Yes | No | No | Yes (managed) | No | Yes (self) |
| View dashboard stats | Yes | No | Yes | No | No | No |

---

## 11. Dashboard / Statistics

### `GET /api/v1/dashboard/stats`
- **Role Requis** : `ADMIN` ou `TRAINING_MANAGER`
- **Description** : Récupère les statistiques globales (cartes et graphiques) pour le tableau de bord.
- **Réponse Attendue (200 OK)** :
```json
{
  "totalCertifications": 4,
  "totalTrainings": 3,
  "totalUsers": 12,
  "totalSquads": 5,
  "certificationsByProvider": [
    {
      "label": "Microsoft",
      "value": 2
    },
    {
      "label": "AWS",
      "value": 1
    }
  ],
  "certificationsBySquad": [
    {
      "label": "DevOps Squad",
      "value": 3
    }
  ],
  "certificationsByDifficulty": [
    {
      "label": "FUNDAMENTAL",
      "value": 2
    },
    {
      "label": "ASSOCIATE",
      "value": 2
    }
  ]
}
```
| View all assignments | Yes | Yes (read) | Yes | managed only | squad only | self only |
| Manage hierarchy | Yes | No | No | No | No | No |
| Rate certification | No | No | No | No | No | Yes (completed) |
| Upload certificate | No | No | No | No | No | Yes |
