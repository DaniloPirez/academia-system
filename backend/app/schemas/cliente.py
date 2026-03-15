from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional


class ClienteBase(BaseModel):
    nome: str
    cpf: str
    data_nascimento: Optional[date] = None
    email: EmailStr
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    status: str = "ativo"
    plano_id: Optional[str] = None
    data_vencimento: Optional[datetime] = None


class ClienteCreate(ClienteBase):
    senha: str


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    cpf: Optional[str] = None
    data_nascimento: Optional[date] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    status: Optional[str] = None
    plano_id: Optional[str] = None
    data_vencimento: Optional[datetime] = None
    senha: Optional[str] = None


class ClienteResponse(BaseModel):
    id: str
    nome: str
    email: str
    status: str
    foto: Optional[str] = None

    class Config:
        from_attributes = True

class ClienteFotoResponse(BaseModel):
    mensagem: str
    foto: str

class ClienteToken(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class ClienteStatusUpdate(BaseModel):
    status: str


class PlanoResumo(BaseModel):
    id: str
    nome: str
    valor: float
    duracao_meses: int

    class Config:
        from_attributes = True


class ClienteMeResponse(BaseModel):
    id: str
    nome: str
    cpf: str
    email: str
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    status: str
    data_vencimento: Optional[datetime] = None
    plano: Optional[PlanoResumo] = None


class DashboardAcessoItem(BaseModel):
    id: str
    data_entrada: datetime
    status: str
    motivo: Optional[str] = None

    class Config:
        from_attributes = True


class ClienteDashboardResponse(BaseModel):
    id: str
    nome: str
    status: str
    data_vencimento: Optional[datetime] = None
    plano_atual: Optional[str] = None
    frequencia_total: int
    ultimo_acesso: Optional[datetime] = None
    ultimos_acessos: list[DashboardAcessoItem]
