import datetime

from pydantic import BaseModel, ConfigDict


class ObservationOut(BaseModel):
    """Ce que l'API renvoie pour une observation : seulement ce dont le frontend a besoin."""

    model_config = ConfigDict(from_attributes=True)

    date: datetime.date
    saison: str
    anomalie: float
