import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Observation


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
