import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import get_db
from app.repository import lister_observations
from app.schemas import ObservationOut

app = FastAPI(title="ENSO Monitor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/v1/observations", response_model=list[ObservationOut])
def get_observations(
    start: datetime.date | None = None,
    end: datetime.date | None = None,
    db: Session = Depends(get_db),
):
    """Renvoie les observations RONI, filtrées par période si start et/ou end sont fournis."""
    if start is not None and end is not None and start > end:
        raise HTTPException(status_code=422, detail="start doit être avant end")
    return lister_observations(db, start, end)
