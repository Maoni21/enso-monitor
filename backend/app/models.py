import datetime

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Indice(Base):
    """Un indice climatique, par exemple le RONI."""

    __tablename__ = "indice"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(unique=True)
    nom_complet: Mapped[str]
    unite: Mapped[str]



class Source(Base):

    __tablename__ = "source"
    

    id: Mapped[int] = mapped_column(primary_key=True)
    producteur: Mapped[str]
    url: Mapped[str]
    version: Mapped[str]

class Import(Base):

    __tablename__ = "import"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id:  Mapped[int] = mapped_column(ForeignKey("source.id"))
    date_extraction: Mapped[datetime.date]
    fichier_brut: Mapped[str]
    lance_le: Mapped[datetime.datetime]
    lues: Mapped[int] 
    rejetees: Mapped[int] 
    doublons: Mapped[int] 
    gardees: Mapped[int] 


class Observation(Base):

    __tablename__ = "observation"


    __table_args__ = (UniqueConstraint("indice_id", "date"),)
    id : Mapped[int] = mapped_column(primary_key=True)
    indice_id : Mapped[int] = mapped_column(ForeignKey("indice.id"))
    import_id : Mapped[int] = mapped_column(ForeignKey("import.id"))
    date : Mapped[datetime.date]
    saison : Mapped[str]
    anomalie : Mapped[float]