import json
from nameko.web.handlers import http
from nameko.rpc import RpcProxy
from werkzeug.wrappers import Response

class GatewayService:
    name = "gateway"

    master_service = RpcProxy("master_service")

    # UNIT AKADEMIK
    @http('POST', '/master/units')
    def create_unit(self, request):
        payload = json.loads(request.get_data(as_text=True))

        result = self.master_service.create_unit(
            name=payload.get('name'),
            type=payload.get('type'),
            parent_id=payload.get('parent_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/units')
    def get_all_units(self, request):
        result = self.master_service.get_all_units()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/units/<string:unit_id>')
    def get_unit_by_id(self, request, unit_id):
        result = self.master_service.get_unit_by_id(unit_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/units/<string:unit_id>')
    def update_unit(self, request, unit_id):
        payload = json.loads(request.get_data(as_text=True))

        result = self.master_service.update_unit(
            unit_id=unit_id,
            name=payload.get('name'),
            type=payload.get('type'),
            parent_id=payload.get('parent_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('DELETE', '/master/units/<string:unit_id>')
    def delete_unit(self, request, unit_id):
        result = self.master_service.delete_unit(unit_id)
        return Response(json.dumps(result), mimetype='/application/json')
    
    # DOSEN
    @http('POST', '/master/lecturers')
    def create_lecturer(self, request):
        payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.create_lecturer(
            nip=payload.get('nip'),
            name=payload.get('name'),
            email=payload.get('email'),
            password=payload.get('password'),
            status=payload.get('status'),
            unit_id=payload.get('unit_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/lecturers')
    def get_all_lecturers(self, request):
        result = self.master_service.get_all_lecturers()
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('GET', '/master/lecturers/<int:lecturer_id>')
    def get_lecturer_by_id(self, request, lecturer_id):
        result = self.master_service.get_lecturer_by_id(lecturer_id)
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('PUT', '/master/lecturer/<int:lecturer_id>')
    def update_lecturer(self, request, lecturer_id):
        payload = json.loads(request.get_data(as_text=True))
        result = self.master_service.update_lecturer(
            lecturer_id=lecturer_id,
            nip=payload.get('nip'),
            name=payload.get('name'),
            email=payload.get('email'),
            password=payload.get('password'),
            status=payload.get('status'),
            unit_id=payload.get('unit_id')
        )
        return Response(json.dumps(result), mimetype='application/json')
    
    @http('DELETE', '/master/lecturers/<int:lecturer_id>')
    def delete_lecturer(self, request, lecturer_id):
        result = self.master_service.delete_lecturer(lecturer_id)
        return Response(json.dumps(result), mimetype='application/json')