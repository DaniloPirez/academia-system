from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class TreinoExercicioExecucao(Base):
    __tablename__ = "treino_exercicio_execucoes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    historico_id = Column(String, ForeignKey("treino_historicos.id"), nullable=False)
    treino_exercicio_id = Column(String, ForeignKey("treino_exercicios.id"), nullable=False)

    nome_exercicio = Column(String, nullable=False)

    series_planejadas = Column(Integer, nullable=True)
    series_concluidas = Column(Integer, default=0)

    repeticoes_planejadas = Column(String, nullable=True)
    repeticoes_realizadas = Column(String, nullable=True)

    carga_planejada = Column(String, nullable=True)
    carga_realizada = Column(String, nullable=True)

    concluido = Column(Boolean, default=False)
    observacoes = Column(Text, nullable=True)

    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    historico = relationship("TreinoHistorico", back_populates="execucoes")