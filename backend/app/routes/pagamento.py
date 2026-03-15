from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models.cliente import Cliente
from app.models.plano import Plano
from app.models.pagamento import Pagamento
from app.schemas.pagamento import PagamentoCreate, PagamentoListItem, PagamentoResponse
from app.core.security import require_admin

router = APIRouter(prefix="/pagamentos", tags=["Pagamentos"])


def _competencia(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


def _ja_existe_pendente(db: Session, cliente_id: str, comp: str) -> bool:
    return (
        db.query(Pagamento)
        .filter(
            Pagamento.cliente_id == cliente_id,
            Pagamento.competencia == comp,
            Pagamento.status == "pendente",
        )
        .first()
        is not None
    )


# 🔹 1️⃣ Criar cobrança (manual / futuro)
@router.post("/criar-cobranca", response_model=dict)
def criar_cobranca(
    dados: PagamentoCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    cliente = db.query(Cliente).filter(Cliente.id == dados.cliente_id).first()
    plano = db.query(Plano).filter(Plano.id == dados.plano_id).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    if not plano.ativo:
        raise HTTPException(status_code=400, detail="Plano está inativo")

    # vencimento pode vir no payload; se não vier, usa data_vencimento do cliente (se existir) ou "agora"
    vencimento = dados.vencimento or cliente.data_vencimento or datetime.utcnow()
    comp = _competencia(vencimento)

    if _ja_existe_pendente(db, cliente.id, comp):
        raise HTTPException(status_code=400, detail="Já existe cobrança pendente para esta competência")

    pagamento = Pagamento(
        cliente_id=cliente.id,
        plano_id=plano.id,
        valor=plano.valor,
        status="pendente",
        data_pagamento=None,
        competencia=comp,
        vencimento=vencimento,
    )

    db.add(pagamento)
    db.commit()
    db.refresh(pagamento)

    return {
        "mensagem": "Cobrança criada com sucesso",
        "pagamento_id": pagamento.id,
        "valor": pagamento.valor,
        "status": pagamento.status
    }


# 🔹 1.1 Listar pagamentos por cliente (para o front)
@router.get("/cliente/{cliente_id}", response_model=list[PagamentoListItem])
def listar_por_cliente(
    cliente_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    itens = (
        db.query(Pagamento)
        .filter(Pagamento.cliente_id == cliente_id)
        .order_by(Pagamento.vencimento.desc())
        .all()
    )

    # inclui plano_nome (se existir relationship carregada)
    out = []
    for p in itens:
        out.append(
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
        )
    return out


# 🔹 1.2 Gerar cobrança manual pelo cliente (usa plano atual do cliente)
@router.post("/cliente/{cliente_id}/gerar-cobranca", response_model=PagamentoResponse)
def gerar_cobranca_manual(
    cliente_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    if not cliente.plano_id:
        raise HTTPException(status_code=400, detail="Cliente não possui plano vinculado")

    plano = db.query(Plano).filter(Plano.id == cliente.plano_id).first()
    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    if not plano.ativo:
        raise HTTPException(status_code=400, detail="Plano está inativo")

    # regra: vencimento = data_vencimento do cliente (se existir) senão agora
    vencimento = cliente.data_vencimento or datetime.utcnow()
    comp = _competencia(vencimento)
    if _ja_existe_pendente(db, cliente.id, comp):
        raise HTTPException(status_code=400, detail="Já existe cobrança pendente para esta competência")

    pagamento = Pagamento(
        cliente_id=cliente.id,
        plano_id=plano.id,
        valor=plano.valor,
        status="pendente",
        data_pagamento=None,
        competencia=comp,
        vencimento=vencimento,
    )
    db.add(pagamento)
    db.commit()
    db.refresh(pagamento)
    return pagamento


# 🔹 1.3 Gerar cobranças automaticamente (clientes vencidos) - pode ser chamado por job/cron
@router.post("/gerar-automatico", response_model=dict)
def gerar_automatico(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    agora = datetime.utcnow()

    clientes_vencidos = (
        db.query(Cliente)
        .filter(Cliente.data_vencimento != None)
        .filter(Cliente.data_vencimento < agora)
        .all()
    )

    criadas = 0
    for c in clientes_vencidos:
        if not c.plano_id:
            continue

        plano = db.query(Plano).filter(Plano.id == c.plano_id).first()
        if not plano or not plano.ativo:
            continue

        # competência baseada no mês atual (evita criar várias no mesmo mês)
        comp = _competencia(agora)
        if _ja_existe_pendente(db, c.id, comp):
            continue

        pagamento = Pagamento(
            cliente_id=c.id,
            plano_id=plano.id,
            valor=plano.valor,
            status="pendente",
            data_pagamento=None,
            competencia=comp,
            vencimento=agora,
        )
        db.add(pagamento)
        criadas += 1

    db.commit()
    return {"mensagem": "Cobranças geradas", "total": criadas}


# 🔹 2️⃣ Confirmar pagamento (simulação webhook)
@router.post("/confirmar/{pagamento_id}")
def confirmar_pagamento(
    pagamento_id: str,
    db: Session = Depends(get_db)
):
    pagamento = db.query(Pagamento).filter(Pagamento.id == pagamento_id).first()

    if not pagamento:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    if pagamento.status == "aprovado":
        return {"mensagem": "Pagamento já confirmado"}

    now = datetime.utcnow()
    pagamento.status = "aprovado"
    pagamento.data_pagamento = now
    if not pagamento.vencimento:
        pagamento.vencimento = now
    if not pagamento.competencia:
        pagamento.competencia = _competencia(pagamento.vencimento)

    cliente = pagamento.cliente
    plano = pagamento.plano

    agora = now

    if cliente.data_vencimento and cliente.data_vencimento > agora:
        nova_data = cliente.data_vencimento + timedelta(days=plano.duracao_meses * 30)
    else:
        nova_data = agora + timedelta(days=plano.duracao_meses * 30)

    cliente.plano_id = plano.id
    cliente.data_vencimento = nova_data
    cliente.status = "ativo"

    db.commit()

    return {
        "mensagem": "Pagamento confirmado e plano ativado",
        "cliente": cliente.nome,
        "vence_em": nova_data
    }