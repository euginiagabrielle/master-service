import json
from nameko.web.handlers import http
from nameko.rpc import RpcProxy
from werkzeug.wrappers import Response


def _cors_response(data, status=200):
    """Helper: bungkus response dengan CORS headers"""
    response = Response(json.dumps(data), mimetype='application/json', status=status)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


class GatewayService:
    name = "gateway_perwalian"

    perwalian_service = RpcProxy("perwalian_service")

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