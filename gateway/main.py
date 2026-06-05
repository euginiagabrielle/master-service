from fastapi import FastAPI
from routers import units

app = FastAPI(
    title="Master API Gateway",
    description="API Gateway untuk Master Service",
    version="1.0.0"
)

app.include_router(units.router)

@app.get("/")
def root():
    return {"message": "API Gateway berjalan. Kunjungi /docs untuk melihat dokumentasi API."}