from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cliente import Cliente
from app.models.pagamento import Pagamento
from app.routes.acesso import Acesso


router = APIRouter(prefix="/sync", tags=["Sincronizacao"])


@router.get("/clientes")
def exportar_clientes(db: Session = Depends(get_db)):
    clientes = db.query(Cliente).filter(Cliente.sincronizado == False).all()
    return clientes


@router.get("/pagamentos")
def exportar_pagamentos(db: Session = Depends(get_db)):
    pagamentos = db.query(Pagamento).filter(Pagamento.sincronizado == False).all()
    return pagamentos


@router.post("/marcar-sincronizado/{tabela}/{registro_id}")
def marcar_sincronizado(tabela: str, registro_id: str, db: Session = Depends(get_db)):
    mapa = {
        "clientes": Cliente,
        "pagamentos": Pagamento,
        "acessos": Acesso,
    }

    Model = mapa.get(tabela)
    if not Model:
        raise HTTPException(status_code=400, detail="Tabela inválida")

    obj = db.query(Model).filter(Model.id == registro_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Registro não encontrado")

    obj.sincronizado = True
    db.commit()

    return {"ok": True, "tabela": tabela, "id": registro_id}