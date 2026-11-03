import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Import, Indice, Observation, Source


def lister_observations(
    session: Session,
    debut: datetime.date | None,
    fin: datetime.date | None,
) -> list[Observation]:
    """Renvoie les observations triées par date, entre debut et fin si elles sont fournies."""
    requete = select(Observation).order_by(Observation.date)
    if debut is not None:
        requete = requete.where(Observation.date >= debut)
    if fin is not None:
        requete = requete.where(Observation.date <= fin)
    return list(session.scalars(requete))


def obtenir_indice(session: Session, nom: str) -> Indice | None:
    """Renvoie l'indice qui porte ce nom, ou None s'il n'existe pas."""
    return session.scalars(select(Indice).where(Indice.nom == nom)).first()


def dernier_import(session: Session) -> Import | None:
    """Renvoie l'import le plus récent, ou None si aucun import n'a encore eu lieu."""
    return session.scalars(select(Import).order_by(Import.lance_le.desc())).first()


def obtenir_source(session: Session, source_id: int) -> Source | None:
    """Renvoie la source qui a ce numéro, ou None si elle n'existe pas."""
    return session.get(Source, source_id)
