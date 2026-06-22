Cara mencoba Auth

Login
Set URL: http://<IP_EC2>:8003/login
Method: POST
Bagian Payload (Body), isi akun:
{
  "username": "sesuai data", 
  "password": "password_dosen"
}
Klik Send.
Copy teks token

Coba functions
Set URL: http://<IP_EC2>:8003/master/courses
Method: GET
Kosongkan bagian Payload/Body JSON
Bagian Headers di YARC
Tambah Header baru:
Name / Key: Authorization
Value: Bearer <PASTE_TOKEN>
