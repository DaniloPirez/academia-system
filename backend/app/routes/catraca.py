from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import re

from app.database import get_db
from app.models.cliente import Cliente
from app.models.acesso import Acesso
from app.schemas.acesso import CatracaCPFRequest, AcessoResponse, FrequenciaItem
from app.core.security import require_staff

router = APIRouter(prefix="/catraca", tags=["Catraca"])


def limpar_cpf(cpf: str) -> str:
    return re.sub(r"\D", "", cpf or "")


def plano_vencido(cliente: Cliente) -> bool:
    if not cliente.data_vencimento:
        return True
    return cliente.data_vencimento < datetime.utcnow()


@router.post("/liberar", response_model=AcessoResponse)
def liberar_catraca_por_cpf(
    payload: CatracaCPFRequest,
    db: Session = Depends(get_db),
    user=Depends(require_staff),
):
    cpf = limpar_cpf(payload.cpf)

    if len(cpf) != 11:
        raise HTTPException(status_code=400, detail="CPF inválido (precisa ter 11 dígitos)")

    cliente = db.query(Cliente).filter(Cliente.cpf == cpf).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    status = "liberado"
    motivo = None

    st = (cliente.status or "").lower()
    if st == "bloqueado":
        status = "bloqueado"
        motivo = "Cliente bloqueado"
    elif st == "inativo":
        status = "bloqueado"
        motivo = "Cliente inativo"
    elif plano_vencido(cliente):
        status = "bloqueado"
        motivo = "Plano vencido"

    acesso = Acesso(
        cliente_id=cliente.id,
        status=status,
        motivo=motivo
    )
    db.add(acesso)
    db.commit()
    db.refresh(acesso)

    return acesso


@router.get("/acessos", response_model=list[AcessoResponse])
def relatorio_acessos_por_periodo(
    inicio: datetime = Query(...),
    fim: datetime = Query(...),
    cpf: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_staff),
):
    q = (
        db.query(Acesso, Cliente.nome.label("cliente_nome"))
        .join(Cliente, Cliente.id == Acesso.cliente_id)
        .filter(
            Acesso.data_entrada >= inicio,
            Acesso.data_entrada <= fim
        )
    )

    if cpf:
        cpf_limpo = limpar_cpf(cpf)
        q = q.filter(Cliente.cpf == cpf_limpo)

    resultados = q.order_by(Acesso.data_entrada.desc()).all()

    # transformar tupla (Acesso, cliente_nome) em dict compatível
    return [
        {
            "id": acesso.id,
            "cliente_id": acesso.cliente_id,
            "cliente_nome": cliente_nome,
            "data_entrada": acesso.data_entrada,
            "status": acesso.status,
            "motivo": acesso.motivo,
        }
        for acesso, cliente_nome in resultados
    ]


@router.get("/frequencia", response_model=list[FrequenciaItem])
def relatorio_frequencia(
    inicio: datetime = Query(...),
    fim: datetime = Query(...),
    db: Session = Depends(get_db),
    user=Depends(require_staff),
):
    resultados = (
        db.query(
            Acesso.cliente_id.label("cliente_id"),
            func.count(Acesso.id).label("total"),
        )
        .filter(
            Acesso.status == "liberado",
            Acesso.data_entrada >= inicio,
            Acesso.data_entrada <= fim,
        )
        .group_by(Acesso.cliente_id)
        .order_by(func.count(Acesso.id).desc())
        .all()
    )

    itens = []
    for r in resultados:
        c = db.query(Cliente).filter(Cliente.id == r.cliente_id).first()
        itens.append({
            "cliente_id": r.cliente_id,
            "cliente_nome": c.nome if c else None,
            "total": int(r.total),
        })
    return itens