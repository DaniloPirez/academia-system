from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base
from sqlalchemy import Boolean

# Observação: mantenha os campos dentro do model (evita colunas soltas no módulo)

class Pagamento(Base):
    __tablename__ = "pagamentos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cliente_id = Column(String, ForeignKey("clientes.id"))
    plano_id = Column(String, ForeignKey("planos.id"))

    valor = Column(Float)
    status = Column(String, default="pendente")  # pendente, aprovado, cancelado
    # Data em que o pagamento foi efetivamente aprovado/confirmado
    data_pagamento = Column(DateTime, nullable=True)

    # Competência da cobrança (ex: "2026-03")
    # IMPORTANTE: nullable=True para não quebrar tabelas já existentes.
    # Para produção, recomenda-se migração + backfill e depois tornar NOT NULL.
    competencia = Column(String, nullable=True, index=True)

    # Data de vencimento da cobrança
    vencimento = Column(DateTime, nullable=True, index=True)

    criado_em = Column(DateTime, default=datetime.utcnow)

    cliente = relationship("Cliente")
    plano = relationship("Plano")
    sincronizado = Column(Boolean, default=False)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)