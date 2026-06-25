import json
import os
import jwt
from datetime import datetime, date
from nameko.web.handlers import http
from nameko.exceptions import BadRequest
from nameko.rpc import RpcProxy
from werkzeug.wrappers import Response

def _cors_response(data, status=200):
    """Helper: bungkus response dengan CORS headers"""
    response = Response(json.dumps(data), mimetype='application/json', status=status)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

def dumps(data):
    def default(obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
    return json.dumps(data, default=default)

class GatewayService:
    name = "gateway"

    master_service = RpcProxy("master_service")
    penawaran_kelas = RpcProxy("penawaran_kelas")
    perwalian_service = RpcProxy("perwalian_service")
    transkrip_rpc = RpcProxy("transkrip_service")
    prs_rpc = RpcProxy("prs_service")

    # LOGIN
    @http('POST', '/login')
    def login(self, request):
        payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.login(
            username=payload.get('username'),
            password=payload.get('password')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    def check_jwt(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None, {"status": "error", "message": "Tiket tidak ditemukan! Silakan login."}
        
        token = auth_header.split(" ")[1]
        try:
            SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "fallback_secret")
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            return payload, None
        except jwt.ExpiredSignatureError:
            return None, {"status": "error", "message": "Tiket sudah kadaluwarsa, login lagi."}
        except jwt.InvalidTokenError:
            return None, {"status": "error", "message": "Tiket palsu!"}
        
    def _check_role(self, payload, allowed_types=None, allowed_roles=None):
        """
        Cek apakah user punya akses berdasarkan type dan role.

        Args:
            payload       : hasil decode JWT
            allowed_types : list type yang diizinkan, misal ["dosen"]
            allowed_roles : list role yang diizinkan, misal ["admin", "kaprodi"]

        Returns:
            (payload, None)     jika akses diizinkan
            (None, Response)    jika akses ditolak
        """
        user_type  = payload.get("type", "")
        user_roles = payload.get("roles", [])

        if allowed_types and user_type not in allowed_types:
            return None, Response(
                json.dumps({"status": "error", "message": f"Akses ditolak. Fitur ini tidak untuk {user_type}."}),
                status=403,
                mimetype="application/json"
            )

        if allowed_roles:
            has_access = any(role in allowed_roles for role in user_roles)
            if not has_access:
                return None, Response(
                    json.dumps({"status": "error", "message": f"Akses ditolak. Butuh role: {allowed_roles}."}),
                    status=403,
                    mimetype="application/json"
                )

        return payload, None

    # def check_access(request, allowed_types=None, allowed_roles=None):
    #     # allowed_types: dosen, mahasiswa
    #     # allowed_roles: admin, kaprodi, sekprodi, dekan, wadek, dll
    #     payload, error: check_jwt(request)
    #     if error:
    #         return None, error
    #     user_type = payload.get("type")
    #     user_roles = payload.get("roles", [])
    #     if allowed_types and user_type not in allowed_types:
    #         return None, {
    #             "status": "error",
    #             "message": f"Akses Ditolak! Fitur ini tidak untuk {user_type}"
    #         }
    #     if allowed_roles:
    #         has_access = any(role in allowed_roles for role in user_roles)
    #         if not has_access:
    #             return None, {
    #                 "status": "error",
    #                 "message": f"Akses Ditolak! Anda butuh role {allowed_roles} untuk mengakses ini."
    #             }   
    #     return payload, None

    # -- MASTER SERVICE -- #
    # UNIT AKADEMIK 
    @http('POST', '/master/units')
    def create_unit(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.create_unit(
            name=body_payload.get('name'),
            type=body_payload.get('type'),
            parent_id=body_payload.get('parent_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/units')
    def get_all_units(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_all_units()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/units/<string:unit_id>')
    def get_unit_by_id(self, request, unit_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_unit_by_id(unit_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/units/<string:unit_id>')
    def update_unit(self, request, unit_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.update_unit(
            unit_id=unit_id,
            name=body_payload.get('name'),
            type=body_payload.get('type'),
            parent_id=body_payload.get('parent_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('DELETE', '/master/units/<string:unit_id>')
    def delete_unit(self, request, unit_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.delete_unit(unit_id)
        return Response(json.dumps(result), mimetype='/application/json')
    
    # DOSEN 
    @http('POST', '/master/lecturers')
    def create_lecturer(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.create_lecturer(
            nip=body_payload.get('nip'),
            name=body_payload.get('name'),
            email=body_payload.get('email'),
            password=body_payload.get('password'),
            status=body_payload.get('status'),
            unit_id=body_payload.get('unit_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/lecturers')
    def get_all_lecturers(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_all_lecturers()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/lecturers/<int:lecturer_id>')
    def get_lecturer_by_id(self, request, lecturer_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_lecturer_by_id(lecturer_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/units/<int:unit_id>/lecturers')
    def get_lecturers_by_unit(self, request, unit_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_lecturers_by_unit(unit_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/lecturers/<int:lecturer_id>')
    def update_lecturer(self, request, lecturer_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.update_lecturer(
            lecturer_id=lecturer_id,
            nip=body_payload.get('nip'),
            name=body_payload.get('name'),
            email=body_payload.get('email'),
            password=body_payload.get('password'),
            status=body_payload.get('status'),
            unit_id=body_payload.get('unit_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('DELETE', '/master/lecturers/<int:lecturer_id>')
    def delete_lecturer(self, request, lecturer_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.delete_lecturer(lecturer_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    # ROLE 
    @http('POST', '/master/roles')
    def create_role(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.create_role(role_name=body_payload.get('role_name'))
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/roles')
    def get_all_roles(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_all_roles()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/roles/<int:role_id>')
    def update_role(self, request, role_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.update_role(
            role_id=role_id,
            name=body_payload.get('name')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('DELETE', '/master/roles/<int:role_id>')
    def delete_role(self, request, role_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.delete_role(role_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    # ASSIGN ROLE 
    @http('POST', '/master/lecturers/<int:lecturer_id>/roles')
    def assign_role_to_lecturer(self, request, lecturer_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.assign_role_to_lecturer(
            lecturer_id=lecturer_id,
            role_id=body_payload.get('role_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/lecturers/<int:lecturer_id>/roles')
    def get_roles_by_lecturer(self, request, lecturer_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_roles_by_lecturer(lecturer_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('DELETE', '/master/lecturers/roles/<int:detail_role_id>')
    def remove_role_from_lecturer(self, request, detail_role_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.remove_role_from_lecturer(detail_role_id)
        return Response(json.dumps(result), mimetype='application/json')

    # MAHASISWA 
    @http('POST', '/master/students')
    def create_student(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.create_student(
            nrp=body_payload.get('nrp'),
            name=body_payload.get('name'),
            email=body_payload.get('email'),
            password=body_payload.get('password'),
            status=body_payload.get('status'),
            unit_id=body_payload.get('unit_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/students')
    def get_all_students(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_all_students()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/students/<int:student_id>')
    def get_student_by_id(self, request, student_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_student_by_id(student_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/units/<int:unit_id>/students')
    def get_students_by_unit(self, request, unit_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_students_by_unit(unit_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/students/<int:student_id>')
    def update_student(self, request, student_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.update_student(
            student_id=student_id,
            nrp=body_payload.get('nrp'),
            name=body_payload.get('name'),
            email=body_payload.get('email'),
            password=body_payload.get('password'),
            status=body_payload.get('status'),
            unit_id=body_payload.get('unit_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('DELETE', '/master/students/<int:student_id>')
    def delete_student(self, request, student_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.delete_student(student_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    # MATA KULIAH 
    @http('POST', '/master/courses')
    def create_course(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.create_course(
            code=body_payload.get('code'),
            name=body_payload.get('name'),
            sks=body_payload.get('sks'),
            unit_id=body_payload.get('unit_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/courses')
    def get_all_courses(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_all_courses()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/courses/<int:course_id>')
    def get_course_by_id(self, request, course_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_course_by_id(course_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/units/<int:unit_id>/courses')
    def get_courses_by_unit(self, request, unit_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_courses_by_unit(unit_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/courses/<int:course_id>')
    def update_course(self, request, course_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.update_course(
            course_id=course_id,
            code=body_payload.get('code'),
            name=body_payload.get('name'),
            sks=body_payload.get('sks'),
            unit_id=body_payload.get('unit_id')
        )
        return Response(json.dumps(result), mimetype='application/json')

    @http('DELETE', '/master/courses/<int:course_id>')
    def delete_course(self, request, course_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.delete_course(course_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    # KURIKULUM 
    @http('POST', '/master/curriculums')
    def create_curriculums(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.create_curriculum(
            name=body_payload.get('name'),
            year=body_payload.get('year'),
            unit_id=body_payload.get('unit_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/curriculums')
    def get_all_curriculums(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_all_curriculums()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/units/<int:unit_id>/curriculums')
    def get_curriculums_by_unit(self, request, unit_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_curriculums_by_unit(unit_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/curriculums/<int:curriculum_id>')
    def update_curriculum(self, request, curriculum_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.update_curriculum(
            curriculum_id=curriculum_id,
            name=body_payload.get('name'),
            year=body_payload.get('year'),
            unit_id=body_payload.get('unit_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    # SEMESTER 
    @http('POST', '/master/semesters')
    def create_semester(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.create_semester(
            name=body_payload.get('name'),
            year=body_payload.get('year'),
            is_active=body_payload.get('is_active'),
            curriculum_id=body_payload.get('curriculum_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/semesters')
    def get_all_semesters(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_all_semesters()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/semesters/<int:semester_id>')
    def get_semester_by_id(self, request, semester_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_semester_by_id(semester_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/semesters/active')
    def get_active_semester(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_active_semester()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/semesters/<int:semester_id>')
    def update_semester(self, request, semester_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.update_semester(
            semester_id=semester_id,
            name=body_payload.get('name'),
            year=body_payload.get('year'),
            is_active=body_payload.get('is_active'),
            curriculum_id=body_payload.get('curriculum_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    # DETAIL MK KURIKULUM 
    @http('POST', '/master/curriculums/<int:curriculum_id>/courses')
    def assign_course_to_curriculum(self, request, curriculum_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.assign_course_to_curriculum(
            curriculum_id=curriculum_id,
            course_id=body_payload.get('course_id'),
            semester=body_payload.get('semester')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/curriculums/courses')
    def get_all_curriculum_courses(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_all_curriculum_courses()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/curriculums/courses/<int:curriculum_course_id>')
    def update_curriculum_course(self, request, curriculum_course_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.update_curriculum_course(
            curriculum_course_id=curriculum_course_id,
            semester=body_payload.get('semester')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/curriculums/<int:curriculum_id>/courses')
    def get_courses_by_curriculum(self, request, curriculum_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_courses_by_curriculum(curriculum_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/curriculums/<int:curriculum_id>/semesters/<int:semester>/courses')
    def get_courses_by_curriculum_and_semester(self, request, curriculum_id, semester):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_courses_by_curriculum_and_semester(curriculum_id, semester)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('DELETE', '/master/curriculums/courses/<int:curriculum_course_id>')
    def remove_course_from_curriculum(self, request, curriculum_course_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.remove_course_from_curriculum(curriculum_course_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    # PRASYARAT KURIKULUM MATA KULIAH 
    @http('POST', '/master/curriculum-courses/<int:curriculum_course_id>/prerequisites')
    def create_prerequisite(self, request, curriculum_course_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.create_prerequisite(
            curriculum_course_id=curriculum_course_id,
            type_prasyarat=body_payload.get('type'),
            prerequisite_course_id=body_payload.get('prerequisite_course_id'),
            minimum_sks=body_payload.get('minimum_sks')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/prerequisites')
    def get_all_prerequisites(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_all_prerequisites()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/prerequisites/<int:prerequisites_id>')
    def update_prerequisite(self, request, prerequisites_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        
        body_payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.update_prerequisite(
            prerequisites_id=prerequisites_id,
            type_prasyarat=body_payload.get('type'),
            prerequisite_course_id=body_payload.get('prerequisite_course_id'),
            minimum_sks=body_payload.get('minimum_sks')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('DELETE', '/master/prerequisites/<int:prerequisites_id>')
    def delete_prerequisite(self, request, prerequisites_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.delete_prerequisite(prerequisites_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/curriculum-courses/<int:curriculum_course_id>/prerequisites')
    def get_prerequisites_by_curriculum_course(self, request, curriculum_course_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return Response(json.dumps(error), status=401, mimetype='application/json')
        result = self.master_service.get_prerequisites_by_curriculum_course(curriculum_course_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    # -- PENAWARAN KELAS SERVICE -- #
    def _ok(self, data, status=200):
        return Response(json.dumps(data), status=status, mimetype='application/json')

    def _err(self, message, status=400):
        return Response(json.dumps({"status": "error", "message": message}),
                        status=status, mimetype='application/json')

    # ────────────────────────────────────────────
    # RUANG
    # ────────────────────────────────────────────

    @http('POST', '/penawaran/ruang')
    def create_ruang(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        body = json.loads(request.get_data(as_text=True))
        result = self.penawaran_kelas.create_ruang(body)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=400)
        return self._ok({"status": "success", "ruang_id": result})

    @http('GET', '/penawaran/ruang')
    def list_ruang(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        tipe   = request.args.get('tipe')
        status = request.args.get('status')
        gedung = request.args.get('gedung')
        result = self.penawaran_kelas.list_ruang(tipe=tipe, status=status, gedung=gedung)
        return self._ok(result)

    @http('GET', '/penawaran/ruang/<int:ruang_id>')
    def get_ruang(self, request, ruang_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        result = self.penawaran_kelas.get_ruang(ruang_id)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=404)
        return self._ok(result)

    @http('PUT', '/penawaran/ruang/<int:ruang_id>')
    def update_ruang(self, request, ruang_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        body = json.loads(request.get_data(as_text=True))
        result = self.penawaran_kelas.update_ruang(ruang_id, body)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=404)
        return self._ok({"status": "success", "message": "Ruang berhasil diupdate"})

    @http('DELETE', '/penawaran/ruang/<int:ruang_id>')
    def hapus_ruang(self, request, ruang_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        result = self.penawaran_kelas.hapus_ruang(ruang_id)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=404)
        return self._ok({"status": "success", "message": "Ruang berhasil dinonaktifkan"})

    # ────────────────────────────────────────────
    # KELAS
    # ────────────────────────────────────────────

    @http('POST', '/penawaran/kelas')
    def create_kelas(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        body = json.loads(request.get_data(as_text=True))
        result = self.penawaran_kelas.create_kelas(body)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=400)
        return self._ok({"status": "success", "kelas_id": result})

    @http('GET', '/penawaran/kelas/tersedia')
    def get_kelas_tersedia(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        semester_id = request.args.get('semester_id')
        if not semester_id:
            return self._err("semester_id diperlukan", status=400)
        result = self.penawaran_kelas.get_kelas_tersedia(int(semester_id))
        return self._ok(result)

    @http('GET', '/penawaran/kelas')
    def list_kelas(self, request):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        semester_id = request.args.get('semester_id')
        unit_id     = request.args.get('unit_id')
        result = self.penawaran_kelas.list_kelas(
            semester_id=int(semester_id) if semester_id else None,
            unit_id=int(unit_id) if unit_id else None,
        )
        return self._ok(result)

    @http('GET', '/penawaran/kelas/<int:kelas_id>')
    def get_kelas(self, request, kelas_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        result = self.penawaran_kelas.get_kelas(kelas_id)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=404)
        return self._ok(result)

    @http('PUT', '/penawaran/kelas/<int:kelas_id>')
    def update_kelas(self, request, kelas_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        body = json.loads(request.get_data(as_text=True))
        result = self.penawaran_kelas.update_kelas(kelas_id, body)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=404)
        return self._ok({"status": "success", "message": "Kelas berhasil diupdate"})

    @http('DELETE', '/penawaran/kelas/<int:kelas_id>')
    def nonaktifkan_kelas(self, request, kelas_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        result = self.penawaran_kelas.nonaktifkan_kelas(kelas_id)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=404)
        return self._ok({"status": "success", "message": "Kelas berhasil dinonaktifkan"})

    # ────────────────────────────────────────────
    # DOSEN PER KELAS
    # ────────────────────────────────────────────

    @http('POST', '/penawaran/kelas/<int:kelas_id>/dosen')
    def tambah_dosen(self, request, kelas_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        body = json.loads(request.get_data(as_text=True))
        result = self.penawaran_kelas.tambah_dosen(
            kelas_id=kelas_id,
            lecturer_id=body.get('lecturer_id'),
            peran=body.get('peran', 'pengampu'),
        )
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=400)
        return self._ok({"status": "success", "kelas_dosen_id": result})

    @http('GET', '/penawaran/kelas/<int:kelas_id>/dosen')
    def get_dosen_by_kelas(self, request, kelas_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        result = self.penawaran_kelas.get_dosen_by_kelas(kelas_id)
        return self._ok(result)

    @http('DELETE', '/penawaran/kelas/dosen/<int:kelas_dosen_id>')
    def remove_dosen(self, request, kelas_dosen_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        result = self.penawaran_kelas.remove_dosen(kelas_dosen_id)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=404)
        return self._ok({"status": "success", "message": "Dosen berhasil dihapus dari kelas"})

    # ────────────────────────────────────────────
    # JADWAL
    # ────────────────────────────────────────────

    @http('POST', '/penawaran/kelas/<int:kelas_id>/jadwal')
    def buat_jadwal(self, request, kelas_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        body = json.loads(request.get_data(as_text=True))
        result = self.penawaran_kelas.buat_jadwal(kelas_id, body)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=400)
        return self._ok({"status": "success", "jadwal_id": result})

    @http('GET', '/penawaran/kelas/<int:kelas_id>/jadwal')
    def get_jadwal(self, request, kelas_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        result = self.penawaran_kelas.get_jadwal(kelas_id)
        return self._ok(result)

    @http('DELETE', '/penawaran/jadwal/<int:jadwal_id>')
    def hapus_jadwal(self, request, jadwal_id):
        jwt_payload, error = self.check_jwt(request)
        if error:
            return self._ok(error, status=401)

        result = self.penawaran_kelas.hapus_jadwal(jadwal_id)
        if isinstance(result, dict) and result.get("error"):
            return self._ok({"status": "error", "message": result["error"]}, status=404)
        return self._ok({"status": "success", "message": "Jadwal berhasil dinonaktifkan"})

    # -- PERWALIAN -- #
    # ===================================================================
    # CORS Preflight Handler (untuk semua endpoint)
    # ===================================================================
    @http('OPTIONS', '/perwalian/<path:path>')
    def options_handler(self, request, path):
        return _cors_response({})

    # ===================================================================
    # DOSEN WALI
    # ===================================================================

    @http('POST', '/perwalian/dosen-wali')
    def assign_dosen_wali(self, request):
        payload = json.loads(request.get_data(as_text=True))
        result = self.perwalian_service.assign_dosen_wali(
            lecturer_id=payload.get('lecturer_id'),
            student_id=payload.get('student_id')
        )
        return _cors_response(result)

    @http('GET', '/perwalian/dosen-wali')
    def get_all_dosen_wali(self, request):
        result = self.perwalian_service.get_all_dosen_wali()
        return _cors_response(result)

    @http('GET', '/perwalian/dosen-wali/<int:dosen_wali_id>')
    def get_dosen_wali_by_id(self, request, dosen_wali_id):
        result = self.perwalian_service.get_dosen_wali_by_id(dosen_wali_id)
        return _cors_response(result)

    @http('GET', '/perwalian/lecturers/<int:lecturer_id>/students')
    def get_students_by_lecturer(self, request, lecturer_id):
        result = self.perwalian_service.get_students_by_lecturer(lecturer_id)
        return _cors_response(result)

    @http('GET', '/perwalian/students/<int:student_id>/lecturer')
    def get_lecturer_by_student(self, request, student_id):
        result = self.perwalian_service.get_lecturer_by_student(student_id)
        return _cors_response(result)

    @http('GET', '/perwalian/laporan/jumlah-mahasiswa-per-dosen')
    def get_count_students_per_lecturer(self, request):
        result = self.perwalian_service.get_count_students_per_lecturer()
        return _cors_response(result)

    @http('PUT', '/perwalian/dosen-wali/<int:dosen_wali_id>')
    def update_dosen_wali(self, request, dosen_wali_id):
        payload = json.loads(request.get_data(as_text=True))
        result = self.perwalian_service.update_dosen_wali(
            dosen_wali_id=dosen_wali_id,
            lecturer_id=payload.get('lecturer_id'),
            student_id=payload.get('student_id'),
            is_active=payload.get('is_active')
        )
        return _cors_response(result)

    @http('DELETE', '/perwalian/dosen-wali/<int:dosen_wali_id>')
    def delete_dosen_wali(self, request, dosen_wali_id):
        result = self.perwalian_service.delete_dosen_wali(dosen_wali_id)
        return _cors_response(result)

    # ===================================================================
    # PERWALIAN
    # ===================================================================

    @http('POST', '/perwalian/perwalians')
    def create_perwalian(self, request):
        payload = json.loads(request.get_data(as_text=True))
        result = self.perwalian_service.create_perwalian(
            dosen_wali_id=payload.get('dosen_wali_id'),
            semester_id=payload.get('semester_id')
        )
        return _cors_response(result)

    @http('GET', '/perwalian/perwalians')
    def get_all_perwalian(self, request):
        result = self.perwalian_service.get_all_perwalian()
        return _cors_response(result)

    @http('GET', '/perwalian/perwalians/<int:perwalian_id>')
    def get_perwalian_by_id(self, request, perwalian_id):
        result = self.perwalian_service.get_perwalian_by_id(perwalian_id)
        return _cors_response(result)

    @http('GET', '/perwalian/students/<int:student_id>/perwalians')
    def get_perwalian_by_student(self, request, student_id):
        semester_id = request.args.get('semester_id', type=int)
        result = self.perwalian_service.get_perwalian_by_student(student_id, semester_id)
        return _cors_response(result)

    @http('POST', '/perwalian/perwalians/<int:perwalian_id>/validate')
    def validate_perwalian(self, request, perwalian_id):
        result = self.perwalian_service.validate_perwalian(perwalian_id)
        return _cors_response(result)

    @http('POST', '/perwalian/perwalians/<int:perwalian_id>/unvalidate')
    def unvalidate_perwalian(self, request, perwalian_id):
        result = self.perwalian_service.unvalidate_perwalian(perwalian_id)
        return _cors_response(result)

    @http('GET', '/perwalian/laporan/rekap/<int:semester_id>')
    def get_rekap_perwalian(self, request, semester_id):
        result = self.perwalian_service.get_rekap_perwalian(semester_id)
        return _cors_response(result)

    @http('DELETE', '/perwalian/perwalians/<int:perwalian_id>')
    def delete_perwalian(self, request, perwalian_id):
        result = self.perwalian_service.delete_perwalian(perwalian_id)
        return _cors_response(result)

    # ===================================================================
    # CATATAN PERWALIAN
    # ===================================================================

    @http('POST', '/perwalian/catatan')
    def create_catatan_perwalian(self, request):
        payload = json.loads(request.get_data(as_text=True))
        result = self.perwalian_service.create_catatan_perwalian(
            perwalian_id=payload.get('perwalian_id'),
            note_content=payload.get('note_content'),
            perwalian_date=payload.get('perwalian_date')
        )
        return _cors_response(result)

    @http('GET', '/perwalian/perwalians/<int:perwalian_id>/catatan')
    def get_catatan_by_perwalian(self, request, perwalian_id):
        result = self.perwalian_service.get_catatan_by_perwalian(perwalian_id)
        return _cors_response(result)

    @http('GET', '/perwalian/catatan/<int:catatan_perwalian_id>')
    def get_catatan_by_id(self, request, catatan_perwalian_id):
        result = self.perwalian_service.get_catatan_by_id(catatan_perwalian_id)
        return _cors_response(result)

    @http('PUT', '/perwalian/catatan/<int:catatan_perwalian_id>')
    def update_catatan_perwalian(self, request, catatan_perwalian_id):
        payload = json.loads(request.get_data(as_text=True))
        result = self.perwalian_service.update_catatan_perwalian(
            catatan_perwalian_id=catatan_perwalian_id,
            note_content=payload.get('note_content'),
            perwalian_date=payload.get('perwalian_date')
        )
        return _cors_response(result)

    @http('DELETE', '/perwalian/catatan/<int:catatan_perwalian_id>')
    def delete_catatan_perwalian(self, request, catatan_perwalian_id):
        result = self.perwalian_service.delete_catatan_perwalian(catatan_perwalian_id)
        return _cors_response(result)
    
    # -- TRANSKRIP -- #
    @http("POST", "/push_semester_ke_krs")
    def push_semester_ke_krs(self, request):
        """
        Push semua peserta PRS tervalidasi ke KRS.
        Hanya bisa diakses oleh dosen dengan role admin/kaprodi/sekprodi.

        Body JSON: {"id_semester": 1}
        """
        jwt_payload, err = self.check_jwt(request)
        if err:
            return Response(json.dumps(err), status=401, mimetype='application/json')

        _, err = self._check_role(jwt_payload, allowed_types=["dosen"])
        if err:
            return err

        try:
            data        = request.get_json(force=True)
            id_semester = data["id_semester"]
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            raise BadRequest(f"Invalid request body: {e}")

        result = self.transkrip_rpc.push_semester_ke_krs(id_semester)

        status_code = 200 if result.get("status") == "ok" else 400
        return Response(json.dumps(result), status=status_code, mimetype="application/json")

    @http("POST", "/input_nilai")
    def input_nilai(self, request):
        """
        Dosen mengisi salah satu komponen nilai.
        Hanya bisa diakses oleh dosen.

        Body JSON: {"id_nilai": 1, "komponen": "uts", "nilai": 85.5}
        """
        jwt_payload, err = self.check_jwt(request)
        if err:
            return Response(json.dumps(err), status=401, mimetype='application/json')

        _, err = self._check_role(jwt_payload, allowed_types=["dosen"])
        if err:
            return err

        try:
            data     = request.get_json(force=True)
            id_nilai = data["id_nilai"]
            komponen = data["komponen"]
            nilai    = data["nilai"]
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            raise BadRequest(f"Invalid request body: {e}")

        result      = self.transkrip_rpc.input_nilai(id_nilai, komponen, nilai)
        status_code = 200 if result.get("status") == "ok" else 400
        return Response(json.dumps(result), status=status_code, mimetype="application/json")

    @http("GET", "/nilai/kelas/<int:id_kelas>")
    def get_nilai_by_kelas(self, request, id_kelas):
        """
        Ambil semua nilai mahasiswa dalam satu kelas.
        Bisa diakses dosen maupun mahasiswa.
        """
        jwt_payload, err = self.check_jwt(request)
        if err:
            return Response(json.dumps(err), status=401, mimetype='application/json')

        result = self.transkrip_rpc.get_nilai_by_kelas(id_kelas)
        return Response(json.dumps(result), status=200, mimetype="application/json")

    @http("GET", "/khs/<int:id_mahasiswa>")
    def get_khs_by_mahasiswa(self, request, id_mahasiswa):
        """
        Ambil KHS mahasiswa untuk semester tertentu.
        Query params: ?tahun_ajaran=2024-2025&semester=Ganjil

        Mahasiswa hanya bisa lihat KHS milik sendiri.
        Dosen bisa lihat KHS siapa saja.
        """
        jwt_payload, err = self.check_jwt(request)
        if err:
            return Response(json.dumps(err), status=401, mimetype='application/json')

        user_type = jwt_payload.get("type")
        user_id   = jwt_payload.get("user_id")
        if user_type == "mahasiswa" and user_id != id_mahasiswa:
            return Response(
                json.dumps({"status": "error", "message": "Akses ditolak. Anda hanya bisa melihat KHS milik sendiri."}),
                status=403,
                mimetype="application/json"
            )

        tahun_ajaran = request.args.get("tahun_ajaran")
        semester     = request.args.get("semester")
        if not tahun_ajaran or not semester:
            raise BadRequest("Query parameter 'tahun_ajaran' dan 'semester' wajib diisi")

        result = self.transkrip_rpc.get_khs_by_mahasiswa(id_mahasiswa, semester, tahun_ajaran)
        return Response(json.dumps(result), status=200, mimetype="application/json")

    @http("GET", "/krs/<int:id_mahasiswa>")
    def get_krs_by_mahasiswa(self, request, id_mahasiswa):
        """Ambil semua KRS milik seorang mahasiswa."""
        jwt_payload, err = self.check_jwt(request)
        if err:
            return Response(json.dumps(err), status=401, mimetype='application/json')

        result = self.transkrip_rpc.get_krs_by_mahasiswa(id_mahasiswa)
        return Response(json.dumps(result), status=200, mimetype="application/json")

    @http("GET", "/transkrip/<int:id_mahasiswa>")
    def get_transkrip_mahasiswa(self, request, id_mahasiswa):
        """
        Ambil transkrip lengkap mahasiswa.
        Mahasiswa hanya bisa lihat transkrip milik sendiri.
        """
        jwt_payload, err = self.check_jwt(request)
        if err:
            return Response(json.dumps(err), status=401, mimetype='application/json')

        user_type = jwt_payload.get("type")
        user_id   = jwt_payload.get("user_id")
        if user_type == "mahasiswa" and user_id != id_mahasiswa:
            return Response(
                json.dumps({"status": "error", "message": "Akses ditolak. Anda hanya bisa melihat transkrip milik sendiri."}),
                status=403,
                mimetype="application/json"
            )

        result      = self.transkrip_rpc.get_transkrip_mahasiswa(id_mahasiswa)
        status_code = 200 if result.get("status") != "error" else 404
        return Response(json.dumps(result), status=status_code, mimetype="application/json")

    @http("GET", "/ips/<int:id_mahasiswa>")
    def get_ips_per_semester(self, request, id_mahasiswa):
        """Ambil riwayat IPS mahasiswa per semester."""
        jwt_payload, err = self.check_jwt(request)
        if err:
            return Response(json.dumps(err), status=401, mimetype='application/json')

        result = self.transkrip_rpc.get_ips_per_semester(id_mahasiswa)
        return Response(json.dumps(result), status=200, mimetype="application/json")

    @http("GET", "/ipk/<int:id_mahasiswa>")
    def get_ipk_mahasiswa(self, request, id_mahasiswa):
        """Ambil IPK terkini mahasiswa."""
        jwt_payload, err = self.check_jwt(request)
        if err:
            return Response(json.dumps(err), status=401, mimetype='application/json')

        result = self.transkrip_rpc.get_ipk_mahasiswa(id_mahasiswa)
        return Response(json.dumps(result), status=200, mimetype="application/json")
    
    # -----------------------------------------------------------------------
    # Health
    # -----------------------------------------------------------------------

    @http("GET", "/health")
    def health(self, request):
        return json.dumps({"status": "ok"})

    # -----------------------------------------------------------------------
    # 1. Create PRS
    # POST /prs
    # -----------------------------------------------------------------------

    @http("POST", "/prs")
    def create_prs(self, request):
        body = json.loads(request.get_data(as_text=True) or "{}")
        required = ["id_mahasiswa", "id_semester", "dosen_wali_id"]
        missing = [f for f in required if f not in body]
        if missing:
            return 400, json.dumps({"success": False, "error": f"Field wajib: {', '.join(missing)}"})

        result = self.prs_rpc.create_prs(
            body["id_mahasiswa"],
            body["id_semester"],
            body["dosen_wali_id"],
        )
        if "error" in result:
            return 400, json.dumps({"success": False, "error": result["error"]})
        return 201, json.dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 2. Create PRS Detail
    # POST /prs/<id_prs>/detail
    # -----------------------------------------------------------------------

    @http("POST", "/prs/<int:id_prs>/detail")
    def create_prs_detail(self, request, id_prs):
        body = json.loads(request.get_data(as_text=True) or "{}")
        required = ["id_kelas", "id_mata_kuliah", "sks"]
        missing = [f for f in required if f not in body]
        if missing:
            return 400, json.dumps({"success": False, "error": f"Field wajib: {', '.join(missing)}"})

        result = self.prs_rpc.create_prs_detail(
            id_prs=id_prs,
            id_kelas=body["id_kelas"],
            id_mata_kuliah=body["id_mata_kuliah"],
            sks=body["sks"],
            prioritas=body.get("prioritas", 1),
        )
        if "error" in result:
            return 400, json.dumps({"success": False, "error": result["error"]})
        return 201, json.dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 3. Get PRS
    # GET /prs/<id_mahasiswa>/<id_semester>
    # -----------------------------------------------------------------------

    @http("GET", "/prs/<int:id_mahasiswa>/<int:id_semester>")
    def get_prs(self, request, id_mahasiswa, id_semester):
        result = self.prs_rpc.get_prs(id_mahasiswa, id_semester)
        if "error" in result:
            return 404, json.dumps({"success": False, "error": result["error"]})
        return dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 4. Get PRS Detail by semester
    # GET /prs/detail/<int:id_semester>
    # -----------------------------------------------------------------------

    @http("GET", "/prs/detail/<int:id_semester>")
    def get_prs_detail_by_semester(self, request, id_semester):
        result = self.prs_rpc.get_prs_detail_by_semester(id_semester)
        return dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 5. Get PRS Detail by prs_id
    # GET /prs/<id_prs>/detail
    # -----------------------------------------------------------------------

    @http("GET", "/prs/<int:id_prs>/detail")
    def get_prs_detail_by_prs_id(self, request, id_prs):
        result = self.prs_rpc.get_prs_detail_by_prs_id(id_prs)
        if isinstance(result, dict) and "error" in result:
            return 404, json.dumps({"success": False, "error": result["error"]})
        return dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 6. Get PRS Detail by kelas
    # GET /prs/detail/kelas/<id_kelas>
    # -----------------------------------------------------------------------

    @http("GET", "/prs/detail/kelas/<int:id_kelas>")
    def get_prs_detail_by_kelas_id(self, request, id_kelas):
        result = self.prs_rpc.get_prs_detail_by_kelas_id(id_kelas)
        return dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 7. Jumlah mahasiswa per kelas
    # GET /prs/kelas/<id_kelas>/jumlah
    # GET /prs/kelas/jumlah
    # -----------------------------------------------------------------------

    @http("GET", "/prs/kelas/<int:id_kelas>/jumlah")
    def get_jumlah_per_kelas(self, request, id_kelas):
        result = self.prs_rpc.get_jumlah_mahasiswa_per_kelas(id_kelas=id_kelas)
        return dumps({"success": True, "data": result})

    @http("GET", "/prs/kelas/jumlah")
    def get_jumlah_all_kelas(self, request):
        result = self.prs_rpc.get_jumlah_mahasiswa_per_kelas()
        return dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 8. Verify single PRS (auto)
    # PUT /prs/<id_prs>/verify
    #
    # PUT because this is an idempotent update to an existing resource.
    # Running it twice produces the same result — correct PUT semantics.
    # No request body needed; all logic is driven by existing DB state.
    # -----------------------------------------------------------------------

    @http("PUT", "/prs/<int:id_prs>/verify")
    def verify_prs(self, request, id_prs):
        result = self.prs_rpc.verify_prs(id_prs=id_prs)
        if "error" in result:
            return 400, json.dumps({"success": False, "error": result["error"]})
        return dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 9. Verify all PRS in a semester (auto, shared capacity pool)
    # PUT /prs/semester/<id_semester>/verify
    #
    # PUT because this is a bulk operation that triggers a significant
    # state transition across many resources — not idempotent (running it
    # twice after changes would re-evaluate changed state).
    # -----------------------------------------------------------------------

    @http("PUT", "/prs/semester/<int:id_semester>/verify")
    def verify_prs_by_semester(self, request, id_semester):
        result = self.prs_rpc.verify_prs_by_semester(id_semester=id_semester)
        if "error" in result:
            return 400, json.dumps({"success": False, "error": result["error"]})
        return dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 10. Push peserta to transkrip
    # POST /prs/transkrip/<id_semester>
    # -----------------------------------------------------------------------

    @http("POST", "/prs/transkrip/<int:id_semester>")
    def push_peserta_to_transkrip(self, request, id_semester):
        result = self.prs_rpc.push_peserta_to_transkrip(id_semester)
        if "error" in result:
            return 404, json.dumps({"success": False, "error": result["error"]})
        return dumps({"success": True, "data": result})
    
    # -----------------------------------------------------------------------
    # 11. Invalidate jadwal snapshot
    # PUT /prs/jadwal/invalidate/<int:id_kelas>
    # -----------------------------------------------------------------------
    
    @http("PUT", "/prs/jadwal/invalidate/<int:id_kelas>")
    def invalidate_jadwal(self, request, id_kelas):
        result = self.prs_rpc.invalidate_jadwal_snapshot(id_kelas=id_kelas)
        if "error" in result:
            return 400, json.dumps({"success": False, "error": result["error"]})
        return dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 12. Snapshot jadwal
    # POST /prs/detail/<id_detail_prs>/jadwal/snapshot
    # -----------------------------------------------------------------------

    @http("POST", "/prs/detail/<int:id_detail_prs>/jadwal/snapshot")
    def snapshot_jadwal(self, request, id_detail_prs):
        body = json.loads(request.get_data(as_text=True) or "{}")

        if "jadwal" not in body:
            return 400, json.dumps({"success": False, "error": "Field jadwal (list) wajib diisi"})

        jadwal_list = body["jadwal"]
        if not isinstance(jadwal_list, list):
            return 400, json.dumps({"success": False, "error": "Field jadwal harus berupa list"})

        required_keys = {"id_jadwal", "hari", "jam_mulai", "jam_selesai", "ruangan", "tipe"}
        for i, j in enumerate(jadwal_list):
            missing = required_keys - j.keys()
            if missing:
                return 400, json.dumps({
                    "success": False,
                    "error": f"Jadwal index {i} kekurangan field: {', '.join(missing)}"
                })

        result = self.prs_rpc.snapshot_jadwal(
            id_detail_prs=id_detail_prs,
            jadwal_list=jadwal_list,
        )
        if "error" in result:
            return 400, json.dumps({"success": False, "error": result["error"]})
        return 201, dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 13. Sync jadwal snapshot
    # POST /prs/jadwal/snapshot/<id_detail_prs>
    # -----------------------------------------------------------------------

    @http("POST", "/prs/jadwal/snapshot/<int:id_detail_prs>")
    def sync_jadwal_snapshot(self, request, id_detail_prs):
        body = json.loads(request.get_data(as_text=True) or "{}")

        if "jadwal" not in body:
            return 400, json.dumps({"success": False, "error": "Field jadwal (list) wajib diisi"})

        jadwal_list = body["jadwal"]
        if not isinstance(jadwal_list, list):
            return 400, json.dumps({"success": False, "error": "Field jadwal harus berupa list"})

        required_keys = {"id_jadwal", "hari", "jam_mulai", "jam_selesai", "ruangan", "tipe"}
        for i, j in enumerate(jadwal_list):
            missing = required_keys - j.keys()
            if missing:
                return 400, json.dumps({
                    "success": False,
                    "error": f"Jadwal index {i} kekurangan field: {', '.join(missing)}"
                })

        result = self.prs_rpc.sync_jadwal_snapshot(
            id_detail_prs=id_detail_prs,
            jadwal_list=jadwal_list,
        )
        if "error" in result:
            return 400, json.dumps({"success": False, "error": result["error"]})
        return dumps({"success": True, "data": result})

    # -----------------------------------------------------------------------
    # 14. Debug dump
    # GET /debug/dump
    # -----------------------------------------------------------------------

    @http("GET", "/debug/dump")
    def debug_dump(self, request):
        result = self.prs_rpc.debug_dump()
        if "error" in result:
            return 500, json.dumps({"success": False, "error": result["error"]})
        return dumps({"success": True, "data": result})
    
    # GET /prs/detail/<id_detail_prs>/jadwal
    @http("GET", "/prs/detail/<int:id_detail_prs>/jadwal")
    def get_jadwal_by_detail(self, request, id_detail_prs):
        result = self.prs_rpc.get_jadwal_by_detail(id_detail_prs=id_detail_prs)
        return dumps({"success": True, "data": result})

    # GET /prs/<id_prs>/jadwal  ← full schedule for one student's PRS
    @http("GET", "/prs/<int:id_prs>/jadwal")
    def get_jadwal_by_prs(self, request, id_prs):
        result = self.prs_rpc.get_jadwal_by_prs(id_prs=id_prs)
        return dumps({"success": True, "data": result})