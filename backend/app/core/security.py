from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.models.cliente import Cliente

SECRET_KEY = "supersecretkeyacademia"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme_staff = OAuth2PasswordBearer(
    tokenUrl="/usuarios/login",
    scheme_name="OAuth2Staff"
)

oauth2_scheme_cliente = OAuth2PasswordBearer(
    tokenUrl="/clientes/login",
    scheme_name="OAuth2Cliente"
)


def hash_senha(senha: str):
    return pwd_context.hash(senha)


def verificar_senha(senha: str, senha_hash: str):
    return pwd_context.verify(senha, senha_hash)


def criar_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def criar_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme_staff),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        if user_id is None or role != "staff":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()

    if usuario is None:
        raise credentials_exception

    return usuario


def get_current_cliente(
    token: str = Depends(oauth2_scheme_cliente),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        if user_id is None or role != "cliente":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    cliente = db.query(Cliente).filter(Cliente.id == user_id).first()

    if cliente is None:
        raise credentials_exception

    return cliente


def require_admin(usuario: Usuario = Depends(get_current_user)):
    if usuario.tipo != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para administradores"
        )
    return usuario


def verificar_vencimento(cliente):
    if cliente.data_vencimento and cliente.data_vencimento < datetime.utcnow():
        cliente.status = "bloqueado"
        return True
    return False


def require_staff(user: Usuario = Depends(get_current_user)):
    if user.tipo not in ("admin", "recepcao", "instrutor"):
        raise HTTPException(status_code=403, detail="Sem permissão")
    return user