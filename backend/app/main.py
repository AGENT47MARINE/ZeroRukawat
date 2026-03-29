from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ZeroRukawat API", version="1.0.0")

# CORS Configuration for Frontend and Admin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to ZeroRukawat API", "status": "operational"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": {"db": "pending", "redis": "pending"}}
