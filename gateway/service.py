import json
import os
import jwt
from nameko.web.handlers import http
from nameko.rpc import RpcProxy
from werkzeug.wrappers import Response

class GatewayService:
    name = "gateway"

    master_service = RpcProxy("master_service")

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

    # UNIT AKADEMIK ✅
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
    
    # DOSEN ✅
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
    
    # ROLE ✅
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
    
    # ASSIGN ROLE ✅
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

    # MAHASISWA ✅
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
    
    # MATA KULIAH ✅
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
    
    # KURIKULUM ✅
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
    
    # SEMESTER ✅
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
    
    # DETAIL MK KURIKULUM ✅
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
    
    # PRASYARAT KURIKULUM MATA KULIAH ✅
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