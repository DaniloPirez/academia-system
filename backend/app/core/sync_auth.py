import os
from fastapi import Header, HTTPException

SYNC_TOKEN = os.getenv("SYNC_TOKEN", "")

def require_sync_token(x_sync_token: str = Header(default="")):
    if not SYNC_TOKEN or x_sync_token != SYNC_TOKEN:
        raise HTTPException(status_code=401, detail="Token de sincronização inválido")