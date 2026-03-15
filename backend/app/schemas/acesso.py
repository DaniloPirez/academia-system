from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CatracaCPFRequest(BaseModel):
    cpf: str

class AcessoResponse(BaseModel):
    id: str
    cliente_id: str
    data_entrada: datetime
    cliente_nome: str | None = None
    status: str
    motivo: Optional[str] = None

class Config:
        from_attributes = True

class FrequenciaItem(BaseModel):
    cliente_id: str
    cliente_nome: Optional[str] = None
    total: int