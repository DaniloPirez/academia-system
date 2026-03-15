from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from uuid import uuid4
from jose import jwt, JWTError

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, Token, UsuarioOut
from app.auth import gerar_hash_senha
from app.core.security import (
    verificar_senha,
    criar_token,
    criar_refresh_token,
    get_current_user,
    require_admin,
    SECRET_KEY,
    ALGORITHM,
)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("/", response_model=UsuarioResponse)
def criar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    novo_usuario = Usuario(
        id=str(uuid4()),
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=gerar_hash_senha(usuario.senha),
        tipo=usuario.tipo,
        refresh_token=None
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(
        Usuario.email == form_data.username
    ).first()

    if not usuario:
        raise HTTPException(status_code=400, detail="Usuário não encontrado")

    if not verificar_senha(form_data.password, usuario.senha_hash):
        raise HTTPException(status_code=400, detail="Senha incorreta")

    access_token = criar_token({
        "sub": str(usuario.id),
        "role": "staff"
    })

    refresh_token = criar_refresh_token({
        "sub": str(usuario.id),
        "role": "staff"
    })

    usuario.refresh_token = refresh_token
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.get("/me")
def usuario_logado(usuario: Usuario = Depends(get_current_user)):
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "tipo": usuario.tipo
    }


@router.get("/admin")
def rota_admin(usuario: Usuario = Depends(require_admin)):
    return {
        "mensagem": "Bem-vindo administrador",
        "usuario": usuario.nome
    }


@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        if user_id is None or role != "staff":
            raise HTTPException(status_code=401, detail="Refresh token inválido")

    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    usuario = db.query(Usuario).filter(
        Usuario.id == user_id,
        Usuario.refresh_token == refresh_token
    ).first()

    if not usuario:
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    new_access_token = criar_token({
        "sub": str(usuario.id),
        "role": "staff"
    })

    new_refresh_token = criar_refresh_token({
        "sub": str(usuario.id),
        "role": "staff"
    })

    usuario.refresh_token = new_refresh_token
    db.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    usuario.refresh_token = None
    db.commit()

    return {"mensagem": "Logout realizado com sucesso"}


@router.get("/", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(Usuario).order_by(Usuario.nome.asc()).all()