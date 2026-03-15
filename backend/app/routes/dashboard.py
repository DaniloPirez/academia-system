from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone

from app.database import get_db
from app.core.security import require_staff  # ou require_recepcao_ou_admin se quiser
from app.models.cliente import Cliente
from app.models.plano import Plano
from app.models.pagamento import Pagamento
from app.models.acesso import Acesso


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/resumo")
def resumo(
    db: Session = Depends(get_db),
    admin=Depends(require_staff)  # troque se quiser permitir recepção ver dashboard
):
    # ✅ Clientes
    total_ativos = db.query(func.count(Cliente.id)).filter(Cliente.status == "ativo").scalar() or 0
    total_bloqueados = db.query(func.count(Cliente.id)).filter(Cliente.status == "bloqueado").scalar() or 0

    # ✅ Planos
    planos_ativos = db.query(func.count(Plano.id)).filter(Plano.ativo == True).scalar() or 0

    # ✅ Receita do mês (pagamentos aprovados)
    agora = datetime.now(timezone.utc)
    inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    receita_mes = (
        db.query(func.coalesce(func.sum(Pagamento.valor), 0))
        .filter(Pagamento.status == "aprovado")
        .filter(Pagamento.data_pagamento >= inicio_mes)
        .scalar()
    ) or 0

    # ✅ Últimos acessos
    ultimos = (
         db.query(Acesso, Cliente.nome)
        .join(Cliente, Cliente.id == Acesso.cliente_id)
        .order_by(Acesso.data_entrada.desc())
        .limit(10)
        .all()
    )

    ultimos_acessos = []
    for acesso, cliente_nome in ultimos:
        ultimos_acessos.append({
            "id": acesso.id,
            "cliente_id": acesso.cliente_id,
            "cliente_nome": cliente_nome,
            "data_entrada": acesso.data_entrada,
            "status": acesso.status,
    })

    return {
        "clientes_ativos": total_ativos,
        "clientes_bloqueados": total_bloqueados,
        "planos_ativos": planos_ativos,
        "receita_mes": float(receita_mes),
        "ultimos_acessos": ultimos_acessos,
    }
    
        
@router.get("/receita-mensal")
def receita_mensal(db: Session = Depends(get_db), user=Depends(require_staff)):
    ano_atual = datetime.utcnow().year

    resultados = (
        db.query(
            func.date_trunc('month', Pagamento.data_pagamento).label("mes"),
            func.sum(Pagamento.valor).label("total")
        )
        .filter(
            Pagamento.status == "aprovado",
            func.extract('year', Pagamento.data_pagamento) == ano_atual
        )
        .group_by("mes")
        .order_by("mes")
        .all()
    )

    return [
        {
            "mes": r.mes.strftime("%m/%Y"),
            "total": float(r.total)
        }
        for r in resultados
    ]    