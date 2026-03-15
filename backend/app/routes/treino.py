from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.models.usuario import Usuario

from app.database import get_db
from app.models.treino import Treino, TreinoExercicio, TreinoHistorico
from app.models.cliente import Cliente
from app.core.security import require_staff, get_current_cliente
from app.schemas.treino import (
    TreinoCreate,
    TreinoResponse,
    TreinoUpdate,
    TreinoHistoricoStart,
    TreinoHistoricoFinish,
    TreinoHistoricoResponse,
    AssociarTreinoBaseRequest,
    TreinoCreateBase,
)
from app.models.usuario import Usuario
from sqlalchemy.orm import Session, joinedload
from app.models.treino_execucao import TreinoExercicioExecucao
from app.schemas.treino_execucao import (
    TreinoExercicioExecucaoResponse,
    TreinoExercicioExecucaoUpdate,
)

router = APIRouter(prefix="/treinos", tags=["Treinos"])

TIPOS_VALIDOS = {
    "hipertrofia",
    "forca_maxima",
    "resistencia",
    "potencia",
    "emagrecimento",
}

CARACTERISTICAS_VALIDAS = {
    "iniciante",
    "veterano",
}


def validar_treino(tipo: str, caracteristica: str):
    if tipo not in TIPOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Tipo de treino inválido")

    if caracteristica not in CARACTERISTICAS_VALIDAS:
        raise HTTPException(status_code=400, detail="Característica inválida")


@router.post("/", response_model=TreinoResponse)
def criar_treino(
    payload: TreinoCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_staff),
):
    validar_treino(payload.tipo, payload.caracteristica)

    cliente = db.query(Cliente).filter(Cliente.id == payload.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    treino = Treino(
        cliente_id=payload.cliente_id,
        instrutor_id=user.id,
        nome=payload.nome,
        tipo=payload.tipo,
        caracteristica=payload.caracteristica,
        descricao=payload.descricao,
    )

    for item in payload.exercicios:
        treino.exercicios.append(
            TreinoExercicio(
                nome_exercicio=item.nome_exercicio,
                video_url=item.video_url,
                dia_semana=item.dia_semana,
                ordem=item.ordem,
                series=item.series,
                repeticoes=item.repeticoes,
                carga=item.carga,
                descanso=item.descanso,
                observacoes=item.observacoes,
            )
        )

    db.add(treino)
    db.commit()
    db.refresh(treino)
    return treino


@router.get("/", response_model=list[TreinoResponse])
def listar_treinos(
    cliente_id: str | None = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_staff),
):
    query = (
        db.query(Treino)
        .options(joinedload(Treino.exercicios))
        .filter(Treino.base == False)
        .order_by(Treino.criado_em.desc())
    )

    if cliente_id:
        query = query.filter(Treino.cliente_id == cliente_id)

    return query.all()


@router.get("/base", response_model=list[TreinoResponse])
def listar_treinos_base(
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_staff),
):
    return (
        db.query(Treino)
        .options(joinedload(Treino.exercicios))
        .filter(Treino.base == True)
        .order_by(Treino.criado_em.desc())
        .all()
    )


@router.get("/{treino_id}", response_model=TreinoResponse)
def obter_treino(
    treino_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_staff),
):
    treino = (
        db.query(Treino)
        .options(joinedload(Treino.exercicios))
        .filter(Treino.id == treino_id)
        .first()
    )

    if not treino:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    return treino


@router.put("/{treino_id}", response_model=TreinoResponse)
def atualizar_treino(
    treino_id: str,
    payload: TreinoUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_staff),
):
    treino = (
        db.query(Treino)
        .options(joinedload(Treino.exercicios))
        .filter(Treino.id == treino_id)
        .first()
    )

    if not treino:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    if payload.tipo is not None and payload.tipo not in TIPOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Tipo de treino inválido")

    if payload.caracteristica is not None and payload.caracteristica not in CARACTERISTICAS_VALIDAS:
        raise HTTPException(status_code=400, detail="Característica inválida")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(treino, campo, valor)

    treino.atualizado_em = datetime.utcnow()

    db.commit()
    db.refresh(treino)
    return treino


@router.delete("/{treino_id}")
def excluir_treino(
    treino_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_staff),
):
    treino = db.query(Treino).filter(Treino.id == treino_id).first()

    if not treino:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    db.delete(treino)
    db.commit()
    return {"mensagem": "Treino removido com sucesso"}


@router.get("/me/lista", response_model=list[TreinoResponse])
def listar_meus_treinos(
    cliente_atual=Depends(get_current_cliente),
    db: Session = Depends(get_db),
):
    treinos = (
        db.query(Treino)
        .options(
            joinedload(Treino.exercicios),
            joinedload(Treino.instrutor),
        )
        .filter(Treino.cliente_id == cliente_atual.id, Treino.ativo == True)
        .order_by(Treino.criado_em.desc())
        .all()
    )

    return [
        TreinoResponse(
            id=treino.id,
            cliente_id=treino.cliente_id,
            instrutor_id=treino.instrutor_id,
            instrutor_nome=treino.instrutor.nome if treino.instrutor else None,
            nome=treino.nome,
            tipo=treino.tipo,
            caracteristica=treino.caracteristica,
            descricao=treino.descricao,
            ativo=treino.ativo,
            criado_em=treino.criado_em,
            atualizado_em=treino.atualizado_em,
            exercicios=treino.exercicios,
        )
        for treino in treinos
    ]


@router.post("/{treino_id}/iniciar", response_model=TreinoHistoricoResponse)
def iniciar_treino(
    treino_id: str,
    payload: TreinoHistoricoStart,
    cliente_atual=Depends(get_current_cliente),
    db: Session = Depends(get_db),
):
    treino = (
        db.query(Treino)
        .options(joinedload(Treino.exercicios))
        .filter(
            Treino.id == treino_id,
            Treino.cliente_id == cliente_atual.id,
            Treino.ativo == True
        )
        .first()
    )

    if not treino:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    historico = TreinoHistorico(
        treino_id=treino.id,
        cliente_id=cliente_atual.id,
        dia_semana=payload.dia_semana,
        iniciado_em=datetime.utcnow(),
        status="iniciado",
    )

    db.add(historico)
    db.flush()

    for exercicio in treino.exercicios:
        execucao = TreinoExercicioExecucao(
            historico_id=historico.id,
            treino_exercicio_id=exercicio.id,
            nome_exercicio=exercicio.nome_exercicio,
            series_planejadas=exercicio.series,
            series_concluidas=0,
            repeticoes_planejadas=exercicio.repeticoes,
            repeticoes_realizadas=None,
            carga_planejada=exercicio.carga,
            carga_realizada=None,
            concluido=False,
            observacoes=None,
        )
        db.add(execucao)

    db.commit()

    historico = (
        db.query(TreinoHistorico)
        .options(joinedload(TreinoHistorico.execucoes))
        .filter(TreinoHistorico.id == historico.id)
        .first()
    )

    return historico


@router.post("/{treino_id}/finalizar/{historico_id}", response_model=TreinoHistoricoResponse)
def finalizar_treino(
    treino_id: str,
    historico_id: str,
    payload: TreinoHistoricoFinish,
    cliente_atual=Depends(get_current_cliente),
    db: Session = Depends(get_db),
):
    historico = (
        db.query(TreinoHistorico)
        .options(joinedload(TreinoHistorico.execucoes))
        .filter(
            TreinoHistorico.id == historico_id,
            TreinoHistorico.treino_id == treino_id,
            TreinoHistorico.cliente_id == cliente_atual.id,
        )
        .first()
    )

    if not historico:
        raise HTTPException(status_code=404, detail="Histórico não encontrado")

    if historico.status == "finalizado":
        raise HTTPException(status_code=400, detail="Treino já foi finalizado")

    finalizado_em = datetime.utcnow()
    duracao = int((finalizado_em - historico.iniciado_em).total_seconds())

    historico.finalizado_em = finalizado_em
    historico.duracao_segundos = duracao
    historico.status = "finalizado"
    historico.observacoes = payload.observacoes

    db.commit()

    historico = (
        db.query(TreinoHistorico)
        .options(joinedload(TreinoHistorico.execucoes))
        .filter(TreinoHistorico.id == historico.id)
        .first()
    )

    return historico


@router.get("/me/historico", response_model=list[TreinoHistoricoResponse])
def historico_meus_treinos(
    cliente_atual=Depends(get_current_cliente),
    db: Session = Depends(get_db),
):
    return (
        db.query(TreinoHistorico)
        .options(joinedload(TreinoHistorico.execucoes))
        .filter(TreinoHistorico.cliente_id == cliente_atual.id)
        .order_by(TreinoHistorico.iniciado_em.desc())
        .all()
    )
    
    
@router.put("/execucoes/{execucao_id}", response_model=TreinoExercicioExecucaoResponse)
def atualizar_execucao_exercicio(
    execucao_id: str,
    payload: TreinoExercicioExecucaoUpdate,
    cliente_atual=Depends(get_current_cliente),
    db: Session = Depends(get_db),
):
    execucao = (
        db.query(TreinoExercicioExecucao)
        .join(TreinoHistorico, TreinoHistorico.id == TreinoExercicioExecucao.historico_id)
        .filter(
            TreinoExercicioExecucao.id == execucao_id,
            TreinoHistorico.cliente_id == cliente_atual.id,
            TreinoHistorico.status == "iniciado",
        )
        .first()
    )

    if not execucao:
        raise HTTPException(status_code=404, detail="Execução não encontrada")

    dados = payload.model_dump(exclude_unset=True)

    for campo, valor in dados.items():
        setattr(execucao, campo, valor)

    if execucao.series_planejadas is not None and execucao.series_concluidas is not None:
        if execucao.series_concluidas >= execucao.series_planejadas:
            execucao.concluido = True

    execucao.atualizado_em = datetime.utcnow()

    db.commit()
    db.refresh(execucao)
    return execucao    


@router.post("/base/{treino_base_id}/associar", response_model=TreinoResponse)
def associar_treino_base_a_cliente(
    treino_base_id: str,
    payload: AssociarTreinoBaseRequest,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_staff),
):
    treino_base = (
        db.query(Treino)
        .options(joinedload(Treino.exercicios))
        .filter(Treino.id == treino_base_id, Treino.base == True)
        .first()
    )

    if not treino_base:
        raise HTTPException(status_code=404, detail="Treino base não encontrado")

    cliente = db.query(Cliente).filter(Cliente.id == payload.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    novo_treino = Treino(
        cliente_id=cliente.id,
        instrutor_id=user.id,
        nome=treino_base.nome,
        tipo=treino_base.tipo,
        caracteristica=treino_base.caracteristica,
        descricao=treino_base.descricao,
        base=False,
        treino_base_id=treino_base.id,
        ativo=True,
    )

    db.add(novo_treino)
    db.flush()

    for exercicio in treino_base.exercicios:
        db.add(
            TreinoExercicio(
                treino_id=novo_treino.id,
                nome_exercicio=exercicio.nome_exercicio,
                video_url=exercicio.video_url,
                dia_semana=exercicio.dia_semana,
                ordem=exercicio.ordem,
                series=exercicio.series,
                repeticoes=exercicio.repeticoes,
                carga=exercicio.carga,
                descanso=exercicio.descanso,
                observacoes=exercicio.observacoes,
            )
        )

    db.commit()

    novo_treino = (
        db.query(Treino)
        .options(joinedload(Treino.exercicios))
        .filter(Treino.id == novo_treino.id)
        .first()
    )

    return novo_treino


@router.post("/base", response_model=TreinoResponse)
def criar_treino_base(
    payload: TreinoCreateBase,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_staff),
):
    treino = Treino(
        cliente_id=None,
        instrutor_id=user.id,
        nome=payload.nome,
        tipo=payload.tipo,
        caracteristica=payload.caracteristica,
        descricao=payload.descricao,
        base=True,
        treino_base_id=None,
        ativo=True,
    )

    db.add(treino)
    db.flush()

    for item in payload.exercicios:
        db.add(
            TreinoExercicio(
                treino_id=treino.id,
                nome_exercicio=item.nome_exercicio,
                video_url=item.video_url,
                dia_semana=item.dia_semana,
                ordem=item.ordem,
                series=item.series,
                repeticoes=item.repeticoes,
                carga=item.carga,
                descanso=item.descanso,
                observacoes=item.observacoes,
            )
        )

    db.commit()

    treino = (
        db.query(Treino)
        .options(joinedload(Treino.exercicios))
        .filter(Treino.id == treino.id)
        .first()
    )

    return treino