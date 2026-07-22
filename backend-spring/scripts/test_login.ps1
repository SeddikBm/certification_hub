$body = @{ email = 'admin@devoteam.com'; password = 'Password123!' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8080/api/v1/auth/login' -Body $body -ContentType 'application/json'
