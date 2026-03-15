from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from typing import Optional, List
from app.schemas.treino_execucao import TreinoExercicioExecucaoResponse


class TreinoExercicioBase(BaseModel):
    nome_exercicio: str
    video_url: Optional[str] = None
    dia_semana: str
    ordem: int = 1
    series: Optional[int] = None
    repeticoes: Optional[str] = None
    carga: Optional[str] = None
    descanso: Optional[str] = None
    observacoes: Optional[str] = None


class TreinoExercicioCreate(TreinoExercicioBase):
    pass


class TreinoExercicioResponse(TreinoExercicioBase):
    id: str

    class Config:
        from_attributes = True


class TreinoCreate(BaseModel):
    cliente_id: str
    nome: str
    tipo: str = Field(..., description="hipertrofia | forca_maxima | resistencia | potencia | emagrecimento")
    caracteristica: str = Field(..., description="iniciante | veterano")
    descricao: Optional[str] = None
    exercicios: List[TreinoExercicioCreate]
    
    
class TreinoCreateBase(BaseModel):
    nome: str
    tipo: str = Field(..., description="hipertrofia | forca_maxima | resistencia | potencia | emagrecimento")
    caracteristica: str = Field(..., description="iniciante | veterano")
    descricao: Optional[str] = None
    exercicios: List[TreinoExercicioCreate]    


class TreinoUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    caracteristica: Optional[str] = None
    descricao: Optional[str] = None
    ativo: Optional[bool] = None


class TreinoResponse(BaseModel):
    id: str
    cliente_id: Optional[str] = None
    instrutor_id: str
    instrutor_nome: Optional[str] = None
    nome: str
    tipo: str
    caracteristica: str
    descricao: Optional[str] = None
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime
    exercicios: List[TreinoExercicioResponse] = []

    class Config:
        from_attributes = True


class TreinoHistoricoStart(BaseModel):
    dia_semana: str


class TreinoHistoricoFinish(BaseModel):
    observacoes: Optional[str] = None


class TreinoHistoricoResponse(BaseModel):
    id: str
    treino_id: str
    cliente_id: str
    dia_semana: str
    iniciado_em: datetime
    finalizado_em: Optional[datetime] = None
    duracao_segundos: Optional[int] = None
    status: str
    observacoes: Optional[str] = None
    execucoes: List[TreinoExercicioExecucaoResponse] = []

    class Config:
        from_attributes = True
        
class AssociarTreinoBaseRequest(BaseModel):
    cliente_id: str        
    
