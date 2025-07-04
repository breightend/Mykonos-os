@echo off
echo Testing User Creation API with curl...

curl -X POST http://localhost:5000/api/user/employees ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"TestUser\",\"fullname\":\"Test User\",\"password\":\"test123456\",\"email\":\"test@example.com\",\"phone\":\"1234567890\",\"domicilio\":\"Test Address 123\",\"cuit\":\"12345678901\",\"role\":\"employee\",\"status\":\"active\",\"profile_image\":\"\",\"session_token\":\"\"}" ^
  -v

echo.
echo Testing Storage List...
curl -X GET http://localhost:5000/api/storage -v

pause
