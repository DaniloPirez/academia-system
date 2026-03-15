from pydantic import BaseModel


class PlanoCreate(BaseModel):
    nome: str
    descricao: str | None = None
    valor: float
    duracao_meses: int


class PlanoUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    valor: float | None = None
    duracao_meses: int | None = None
    ativo: bool | None = None


class PlanoResponse(BaseModel):
    id: str
    nome: str
    descricao: str | None
    valor: float
    duracao_meses: int
    ativo: bool

    class Config:
        from_attributes = True