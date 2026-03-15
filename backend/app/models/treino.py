from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base
from sqlalchemy.orm import relationship

class Treino(Base):
    __tablename__ = "treinos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cliente_id = Column(String, ForeignKey("clientes.id"), nullable=True)
    instrutor_id = Column(String, ForeignKey("usuarios.id"), nullable=False)
    instrutor = relationship("Usuario")

    nome = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # hipertrofia, forca_maxima, resistencia, potencia, emagrecimento
    caracteristica = Column(String, nullable=False)  # iniciante, veterano
    descricao = Column(Text, nullable=True)
    
    base = Column(Boolean, default=False)
    treino_base_id = Column(String, ForeignKey("treinos.id"), nullable=True)    

    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


    exercicios = relationship(
        "TreinoExercicio",
        back_populates="treino",
        cascade="all, delete-orphan"
    )

    historicos = relationship(
        "TreinoHistorico",
        back_populates="treino",
        cascade="all, delete-orphan"
    )


class TreinoExercicio(Base):
    __tablename__ = "treino_exercicios"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    treino_id = Column(String, ForeignKey("treinos.id"), nullable=False)

    nome_exercicio = Column(String, nullable=False)
    video_url = Column(String, nullable=True)

    dia_semana = Column(String, nullable=False)  # segunda, terca, quarta...
    ordem = Column(Integer, default=1)

    series = Column(Integer, nullable=True)
    repeticoes = Column(String, nullable=True)  # ex: "12", "10-12", "30s"
    carga = Column(String, nullable=True)       # ex: "20kg"
    descanso = Column(String, nullable=True)    # ex: "60s"
    observacoes = Column(Text, nullable=True)

    treino = relationship("Treino", back_populates="exercicios")


class TreinoHistorico(Base):
    __tablename__ = "treino_historicos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    treino_id = Column(String, ForeignKey("treinos.id"), nullable=False)
    cliente_id = Column(String, ForeignKey("clientes.id"), nullable=False)

    dia_semana = Column(String, nullable=False)
    iniciado_em = Column(DateTime, default=datetime.utcnow)
    finalizado_em = Column(DateTime, nullable=True)
    duracao_segundos = Column(Integer, nullable=True)

    status = Column(String, default="iniciado")  # iniciado, finalizado
    observacoes = Column(Text, nullable=True)

    treino = relationship("Treino", back_populates="historicos")
    execucoes = relationship(
        "TreinoExercicioExecucao",
        back_populates="historico",
        cascade="all, delete-orphan"
    )