from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.cliente import Cliente
from app.models.acesso import Acesso

router = APIRouter(prefix="/acesso", tags=["Catraca"])


@router.post("/entrar/{cliente_id}")
def registrar_entrada(cliente_id: str, db: Session = Depends(get_db)):

    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    agora = datetime.utcnow()

    # 🔥 Valida vencimento
    if not cliente.data_vencimento or cliente.data_vencimento < agora:
        cliente.status = "bloqueado"

        acesso = Acesso(
            cliente_id=cliente.id,
            status="bloqueado"
        )

        db.add(acesso)
        db.commit()

        raise HTTPException(status_code=403, detail="Plano vencido. Acesso bloqueado.")

    if cliente.status != "ativo":
        acesso = Acesso(
            cliente_id=cliente.id,
            status="bloqueado"
        )

        db.add(acesso)
        db.commit()

        raise HTTPException(status_code=403, detail="Cliente não está ativo")

    # ✅ LIBERA ACESSO
    acesso = Acesso(
        cliente_id=cliente.id,
        status="liberado"
    )

    db.add(acesso)
    db.commit()

    return {
        "mensagem": "Acesso liberado",
        "cliente": cliente.nome,
        "horario": datetime.utcnow()
    }
    
@router.get("/frequencia/{cliente_id}")
def relatorio_cliente(
    cliente_id: str,
    db: Session = Depends(get_db)
):
    acessos = db.query(Acesso).filter(
        Acesso.cliente_id == cliente_id,
        Acesso.status == "liberado"
    ).all()

    total = len(acessos)

    return {
        "cliente_id": cliente_id,
        "total_acessos": total,
        "datas": [a.data_entrada for a in acessos]
    }
    
@router.get("/frequencia-periodo")
def relatorio_periodo(
    data_inicio: str,
    data_fim: str,
    db: Session = Depends(get_db)
):
    inicio = datetime.fromisoformat(data_inicio)
    fim = datetime.fromisoformat(data_fim)

    acessos = db.query(Acesso).filter(
        Acesso.data_entrada >= inicio,
        Acesso.data_entrada <= fim,
        Acesso.status == "liberado"
    ).all()

    return {
        "periodo": f"{inicio} até {fim}",
        "total_acessos": len(acessos)
    }    