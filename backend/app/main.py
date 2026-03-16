from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .database import engine, Base
from . import models
from .routes import usuario
from app.routes import cliente, plano, acesso, pagamento, sync, catraca, dashboard, treino

Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://academia-system-hdw2.vercel.app",
    "https://academia-system-nhrjhqmsy-danilopirezs-projects.vercel.app",
    "https://academia-system-tau.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("storage/clientes", exist_ok=True)
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

app.include_router(usuario.router)
app.include_router(cliente.router)
app.include_router(plano.router)
app.include_router(acesso.router)
app.include_router(pagamento.router)
app.include_router(sync.router)
app.include_router(dashboard.router)
app.include_router(catraca.router)
app.include_router(treino.router)

@app.get("/")
def home():
    return {"mensagem": "Banco conectado com sucesso 🚀"}
