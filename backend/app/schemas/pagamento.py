from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PagamentoCreate(BaseModel):
    cliente_id: str
    plano_id: str
    vencimento: Optional[datetime] = None


class PagamentoResponse(BaseModel):
    id: str
    cliente_id: str
    plano_id: str
    valor: float
    status: str
    data_pagamento: Optional[datetime] = None
    competencia: Optional[str] = None
    vencimento: Optional[datetime] = None
    criado_em: datetime

    class Config:
        from_attributes = True


class PagamentoListItem(BaseModel):
    id: str
    cliente_id: str
    plano_id: str
    valor: float
    status: str
    competencia: Optional[str] = None
    vencimento: Optional[datetime] = None
    criado_em: datetime
    data_pagamento: Optional[datetime] = None
    plano_nome: Optional[str] = None

    class Config:
        from_attributes = True
