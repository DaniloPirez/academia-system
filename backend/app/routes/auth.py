from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
from app.auth import create_access_token, create_refresh_token
from app.utils import verify_password  # sua função que valida senha

router = APIRouter()


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(
        Usuario.email == form_data.username
    ).first()

    if not usuario:
        raise HTTPException(status_code=400, detail="Usuário não encontrado")

    if not verify_password(form_data.password, usuario.senha_hash):
        raise HTTPException(status_code=400, detail="Senha incorreta")

    # 🔐 Criar tokens
    access_token = create_access_token(
        data={"sub": str(usuario.id)}
    )

    refresh_token = create_refresh_token(
        data={"sub": str(usuario.id)}
    )

    # 💾 Salvar refresh token no banco
    usuario.refresh_token = refresh_token
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }