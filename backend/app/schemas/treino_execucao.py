from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TreinoExercicioExecucaoResponse(BaseModel):
    id: str
    historico_id: str
    treino_exercicio_id: str
    nome_exercicio: str

    series_planejadas: Optional[int] = None
    series_concluidas: int = 0

    repeticoes_planejadas: Optional[str] = None
    repeticoes_realizadas: Optional[str] = None

    carga_planejada: Optional[str] = None
    carga_realizada: Optional[str] = None

    concluido: bool = False
    observacoes: Optional[str] = None

    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True


class TreinoExercicioExecucaoUpdate(BaseModel):
    series_concluidas: Optional[int] = None
    repeticoes_realizadas: Optional[str] = None
    carga_realizada: Optional[str] = None
    concluido: Optional[bool] = None
    observacoes: Optional[str] = None