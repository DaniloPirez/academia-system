from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.sync_auth import require_sync_token

from app.models.cliente import Cliente
from app.models.acesso import Acesso

router = APIRouter(prefix="/sync/importar", tags=["Sync Ingest"])


@router.post("/clientes", dependencies=[Depends(require_sync_token)])
def importar_clientes(payload: list[dict], db: Session = Depends(get_db)):
    recebidos = 0

    for item in payload:
        # upsert por ID
        obj = db.query(Cliente).filter(Cliente.id == item["id"]).first()
        if obj:
            # atualiza campos principais (ajuste conforme seu model)
            obj.nome = item.get("nome", obj.nome)
            obj.cpf = item.get("cpf", obj.cpf)
            obj.email = item.get("email", obj.email)
            obj.telefone = item.get("telefone", obj.telefone)
            obj.endereco = item.get("endereco", obj.endereco)
            obj.foto = item.get("foto", obj.foto)
            obj.status = item.get("status", obj.status)
            obj.plano_id = item.get("plano_id", obj.plano_id)
            obj.data_vencimento = item.get("data_vencimento", obj.data_vencimento)
            # IMPORTANTE: na nuvem, não faz sentido “sincronizado”
            # pode ignorar item["sincronizado"]
        else:
            obj = Cliente(**{k: v for k, v in item.items() if k != "sincronizado"})
            db.add(obj)

        recebidos += 1

    db.commit()
    return {"recebidos": recebidos}


@router.post("/acessos", dependencies=[Depends(require_sync_token)])
def importar_acessos(payload: list[dict], db: Session = Depends(get_db)):
    recebidos = 0

    for item in payload:
        obj = db.query(Acesso).filter(Acesso.id == item["id"]).first()
        if obj:
            # normalmente acesso é imutável, mas se quiser atualizar:
            obj.cliente_id = item.get("cliente_id", obj.cliente_id)
            obj.data_entrada = item.get("data_entrada", obj.data_entrada)
            obj.status = item.get("status", obj.status)
        else:
            obj = Acesso(**{k: v for k, v in item.items() if k != "sincronizado"})
            db.add(obj)

        recebidos += 1

    db.commit()
    return {"recebidos": recebidos}