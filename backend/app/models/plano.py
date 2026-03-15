from sqlalchemy import Column, String, Float, Integer, Boolean
import uuid
from app.database import Base
from sqlalchemy import Boolean
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey


class Plano(Base):
    __tablename__ = "planos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String, nullable=False)
    descricao = Column(String)
    valor = Column(Float, nullable=False)
    duracao_meses = Column(Integer, nullable=False)
    ativo = Column(Boolean, default=True)
    sincronizado = Column(Boolean, default=False)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)