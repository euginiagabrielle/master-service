from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from nameko.standalone.rpc import ClusterRpcProxy

router = APIRouter(
    prefix="/master/units",
    tags=["Unit Akademik"]
)

CONFIG = {'AMQP_URI': 'pyamqp://guest:guest@rabbitmq'}

class UnitAkademikInput(BaseModel):
    name: str
    type: str
    parent_id: Optional[str] = None

class UnitAkademikUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    parent_id: Optional[str] = None

@router.post("/")
def create_unit(unit: UnitAkademikInput):
    with ClusterRpcProxy(CONFIG) as rpc:
        result = rpc.master_service.create_unit(name=unit.name, type=unit.type, parent_id=unit.parent_id)
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result

@router.get("/")
def get_all_units():
    with ClusterRpcProxy(CONFIG) as rpc:
        return rpc.master_service.get_all_units()
    
@router.get("/{unit_id}")
def get_unit_by_id(unit_id: str):
    with ClusterRpcProxy(CONFIG) as rpc:
        result = rpc.master_service.get_unit_by_id(unit_id=unit_id)
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result

@router.put("/{unit_id}")
def update_unit(unit_id: str, unit: UnitAkademikUpdate):
    with ClusterRpcProxy(CONFIG) as rpc:
        result = rpc.master_service.update_unit(
            unit_id=unit_id,
            name=unit.name,
            type=unit.type,
            parent_id=unit.parent_id
        )
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result

@router.delete("/{unit_id}")
def delete_unit(unit_id: str):
    with ClusterRpcProxy(CONFIG) as rpc:
        result = rpc.master_service.delete_unit(unit_id=unit_id)
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result