from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Literal

TipoUsuario = Literal["admin", "recepcao", "instrutor"]

class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    tipo: TipoUsuario


class UsuarioResponse(BaseModel):
    id: UUID
    nome: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }
    
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str 
    
class UsuarioOut(BaseModel):
    id: str
    nome: str
    email: str
    tipo: str
    ativo: bool | None = True

    class Config:
        from_attributes = True    