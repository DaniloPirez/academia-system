from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.plano import Plano
from app.schemas.plano import PlanoCreate, PlanoUpdate, PlanoResponse
from app.core.security import require_admin

router = APIRouter(prefix="/planos", tags=["Planos"])


@router.post("/", response_model=PlanoResponse)
def criar_plano(
    plano: PlanoCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    novo_plano = Plano(**plano.dict())
    db.add(novo_plano)
    db.commit()
    db.refresh(novo_plano)
    return novo_plano


@router.get("/", response_model=list[PlanoResponse])
def listar_planos(db: Session = Depends(get_db)):
    return db.query(Plano).filter(Plano.ativo == True).all()


@router.get("/{plano_id}", response_model=PlanoResponse)
def buscar_plano(plano_id: str, db: Session = Depends(get_db)):
    plano = db.query(Plano).filter(Plano.id == plano_id).first()
    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    return plano


@router.put("/{plano_id}", response_model=PlanoResponse)
def atualizar_plano(
    plano_id: str,
    dados: PlanoUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    plano = db.query(Plano).filter(Plano.id == plano_id).first()

    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    for campo, valor in dados.dict(exclude_unset=True).items():
        setattr(plano, campo, valor)

    db.commit()
    db.refresh(plano)

    return plano


@router.delete("/{plano_id}")
def deletar_plano(
    plano_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    plano = db.query(Plano).filter(Plano.id == plano_id).first()

    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    db.delete(plano)
    db.commit()

    return {"mensagem": "Plano deletado com sucesso"}