from sqlalchemy import Column, String
import uuid
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)

    tipo = Column(String, nullable=False, default="aluno")  # ✅ AGORA É COLUNA

    refresh_token = Column(String, nullable=True)