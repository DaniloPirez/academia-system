from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    nome = Column(String, nullable=False)
    cpf = Column(String, unique=True, nullable=False)
    data_nascimento = Column(Date, nullable=True)

    email = Column(String, unique=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)

    telefone = Column(String)
    endereco = Column(String)
    foto = Column(String, nullable=True)

    status = Column(String, default="ativo")  # ativo | inativo | bloqueado

    plano_id = Column(String, ForeignKey("planos.id"), nullable=True)
    plano = relationship("Plano")

    data_vencimento = Column(DateTime, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    sincronizado = Column(Boolean, default=False)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
