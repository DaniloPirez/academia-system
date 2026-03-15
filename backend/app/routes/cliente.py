from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import shutil
import os

from app.auth import gerar_hash_senha
from app.core.security import (
    criar_refresh_token,
    criar_token,
    get_current_cliente,
    hash_senha,
    require_staff,
    verificar_senha,
    verificar_vencimento,
)
from app.database import get_db
from app.models.acesso import Acesso
from app.models.cliente import Cliente
from app.models.plano import Plano
from app.models.pagamento import Pagamento
from app.schemas.cliente import (
    ClienteCreate,
    ClienteDashboardResponse,
    ClienteMeResponse,
    ClienteResponse,
    ClienteStatusUpdate,
    ClienteToken,
    ClienteUpdate,
    ClienteFotoResponse,
)
from app.schemas.pagamento import PagamentoListItem

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("/")
def listar_clientes(db: Session = Depends(get_db), user=Depends(require_staff)):
    return db.query(Cliente).all()


@router.post("/", response_model=ClienteResponse)
def criar_cliente(
    cliente: ClienteCreate,
    db: Session = Depends(get_db),
    user=Depends(require_staff)
):
    novo_cliente = Cliente(
        id=str(uuid4()),
        nome=cliente.nome,
        cpf=cliente.cpf,
        data_nascimento=getattr(cliente, "data_nascimento", None),
        email=cliente.email,
        senha_hash=hash_senha(cliente.senha),
        telefone=cliente.telefone,
        endereco=cliente.endereco,
        status="ativo",
        foto=None
    )

    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)
    return novo_cliente


@router.post("/login", response_model=ClienteToken)
def login_cliente(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    cliente = db.query(Cliente).filter(Cliente.email == form_data.username).first()

    if not cliente or not verificar_senha(form_data.password, cliente.senha_hash):
        raise HTTPException(status_code=400, detail="E-mail ou senha inválidos")

    access_token = criar_token({
        "sub": str(cliente.id),
        "role": "cliente"
    })

    refresh_token = criar_refresh_token({
        "sub": str(cliente.id),
        "role": "cliente"
    })

    cliente.refresh_token = refresh_token
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.get("/me")
def obter_meu_perfil(
    db: Session = Depends(get_db),
    cliente_atual: Cliente = Depends(get_current_cliente)
):
    plano = None
    if cliente_atual.plano_id:
        plano = db.query(Plano).filter(Plano.id == cliente_atual.plano_id).first()

    return {
        "id": cliente_atual.id,
        "nome": cliente_atual.nome,
        "email": cliente_atual.email,
        "telefone": cliente_atual.telefone,
        "endereco": cliente_atual.endereco,
        "status": cliente_atual.status,
        "data_vencimento": cliente_atual.data_vencimento,
        "foto": cliente_atual.foto,
        "plano": {
            "id": plano.id,
            "nome": plano.nome,
            "valor": plano.valor,
            "duracao_meses": plano.duracao_meses
        } if plano else None
    }


@router.get("/me/dashboard", response_model=ClienteDashboardResponse)
def dashboard_cliente(
    cliente_atual: Cliente = Depends(get_current_cliente),
    db: Session = Depends(get_db),
):
    if verificar_vencimento(cliente_atual):
        db.commit()
        db.refresh(cliente_atual)

    plano = None
    if cliente_atual.plano_id:
        plano = db.query(Plano).filter(Plano.id == cliente_atual.plano_id).first()

    acessos_liberados = (
        db.query(Acesso)
        .filter(Acesso.cliente_id == cliente_atual.id, Acesso.status == "liberado")
        .order_by(Acesso.data_entrada.desc())
        .all()
    )

    ultimos_acessos = acessos_liberados[:10]
    ultimo_acesso = ultimos_acessos[0].data_entrada if ultimos_acessos else None

    return {
        "id": cliente_atual.id,
        "nome": cliente_atual.nome,
        "status": cliente_atual.status,
        "data_vencimento": cliente_atual.data_vencimento,
        "plano_atual": plano.nome if plano else None,
        "frequencia_total": len(acessos_liberados),
        "ultimo_acesso": ultimo_acesso,
        "ultimos_acessos": ultimos_acessos,
    }


@router.get("/me/acessos")
def meus_acessos(
    cliente_atual: Cliente = Depends(get_current_cliente),
    db: Session = Depends(get_db),
):
    return (
        db.query(Acesso)
        .filter(Acesso.cliente_id == cliente_atual.id)
        .order_by(Acesso.data_entrada.desc())
        .all()
    )


@router.get("/me/frequencia")
def minha_frequencia(
    cliente_atual: Cliente = Depends(get_current_cliente),
    db: Session = Depends(get_db),
):
    acessos = (
        db.query(Acesso)
        .filter(Acesso.cliente_id == cliente_atual.id, Acesso.status == "liberado")
        .order_by(Acesso.data_entrada.desc())
        .all()
    )

    return {
        "cliente_id": cliente_atual.id,
        "total_acessos": len(acessos),
        "datas": [a.data_entrada for a in acessos],
    }


@router.get("/me/pagamentos", response_model=list[PagamentoListItem])
def meus_pagamentos(
    cliente_atual: Cliente = Depends(get_current_cliente),
    db: Session = Depends(get_db),
):
    itens = (
        db.query(Pagamento)
        .filter(Pagamento.cliente_id == cliente_atual.id)
        .order_by(Pagamento.vencimento.desc(), Pagamento.criado_em.desc())
        .all()
    )

    return [
        {
            "id": p.id,
            "cliente_id": p.cliente_id,
            "plano_id": p.plano_id,
            "valor": p.valor,
            "status": p.status,
            "competencia": p.competencia,
            "vencimento": p.vencimento,
            "criado_em": p.criado_em,
            "data_pagamento": p.data_pagamento,
            "plano_nome": p.plano.nome if p.plano else None,
        }
        for p in itens
    ]


@router.put("/{cliente_id}/vincular-plano/{plano_id}")
def vincular_plano(
    cliente_id: str,
    plano_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_staff)
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    plano = db.query(Plano).filter(Plano.id == plano_id).first()
    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    if not plano.ativo:
        raise HTTPException(status_code=400, detail="Plano está inativo")

    nova_data_vencimento = datetime.utcnow() + timedelta(days=plano.duracao_meses * 30)

    cliente.plano_id = plano.id
    cliente.data_vencimento = nova_data_vencimento
    cliente.status = "ativo"

    db.commit()

    return {
        "mensagem": "Plano vinculado com sucesso",
        "cliente": cliente.nome,
        "plano": plano.nome,
        "vence_em": nova_data_vencimento,
    }


@router.patch("/{cliente_id}/status")
def alterar_status(cliente_id: str, payload: ClienteStatusUpdate, db: Session = Depends(get_db), user=Depends(require_staff)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(404, "Cliente não encontrado")
    c.status = payload.status
    db.commit()
    db.refresh(c)
    return c


@router.post("/me/logout")
def logout_cliente(
    db: Session = Depends(get_db),
    cliente_atual: Cliente = Depends(get_current_cliente)
):
    cliente_atual.refresh_token = None
    db.commit()
    return {"mensagem": "Logout realizado com sucesso"}


@router.put("/{cliente_id}", response_model=ClienteResponse)
def editar_cliente(
    cliente_id: str,
    payload: ClienteUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_staff)
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    data = payload.dict(exclude_unset=True)

    if "senha" in data and data["senha"]:
        cliente.senha_hash = gerar_hash_senha(data["senha"])
        data.pop("senha", None)

    for campo, valor in data.items():
        setattr(cliente, campo, valor)

    db.commit()
    db.refresh(cliente)
    return cliente


@router.post("/me/foto", response_model=ClienteFotoResponse)
def upload_minha_foto(
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    cliente_atual: Cliente = Depends(get_current_cliente)
):
    if not foto.content_type or not foto.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado deve ser uma imagem")

    extensao = os.path.splitext(foto.filename)[1].lower()
    if extensao not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=400,
            detail="Formato inválido. Use jpg, jpeg, png ou webp"
        )

    pasta_destino = "storage/clientes"
    os.makedirs(pasta_destino, exist_ok=True)

    nome_arquivo = f"{cliente_atual.id}_{uuid4().hex}{extensao}"
    caminho_arquivo = os.path.join(pasta_destino, nome_arquivo)

    with open(caminho_arquivo, "wb") as buffer:
        shutil.copyfileobj(foto.file, buffer)

    if cliente_atual.foto:
        foto_antiga = cliente_atual.foto.lstrip("/")
        if os.path.exists(foto_antiga):
            try:
                os.remove(foto_antiga)
            except Exception:
                pass

    cliente_atual.foto = f"/storage/clientes/{nome_arquivo}"
    db.commit()
    db.refresh(cliente_atual)

    return {
        "mensagem": "Foto atualizada com sucesso",
        "foto": cliente_atual.foto
    }


@router.post("/{cliente_id}/foto", response_model=ClienteFotoResponse)
def upload_foto_cliente(
    cliente_id: str,
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_staff)
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    if not foto.content_type or not foto.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado deve ser uma imagem")

    extensao = os.path.splitext(foto.filename)[1].lower()
    if extensao not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=400,
            detail="Formato inválido. Use jpg, jpeg, png ou webp"
        )

    pasta_destino = "storage/clientes"
    os.makedirs(pasta_destino, exist_ok=True)

    nome_arquivo = f"{cliente.id}_{uuid4().hex}{extensao}"
    caminho_arquivo = os.path.join(pasta_destino, nome_arquivo)

    with open(caminho_arquivo, "wb") as buffer:
        shutil.copyfileobj(foto.file, buffer)

    if cliente.foto:
        foto_antiga = cliente.foto.lstrip("/")
        if os.path.exists(foto_antiga):
            try:
                os.remove(foto_antiga)
            except Exception:
                pass

    cliente.foto = f"/storage/clientes/{nome_arquivo}"
    db.commit()
    db.refresh(cliente)

    return {
        "mensagem": "Foto atualizada com sucesso",
        "foto": cliente.foto
    }