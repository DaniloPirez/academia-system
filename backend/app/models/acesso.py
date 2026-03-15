from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base

class Acesso(Base):
    __tablename__ = "acessos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cliente_id = Column(String, ForeignKey("clientes.id"), nullable=False)

    data_entrada = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, nullable=False)  # liberado / bloqueado
    motivo = Column(String, nullable=True)

    cliente = relationship("Cliente")

    sincronizado = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)