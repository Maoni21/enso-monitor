import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    """Classe mère de tous les modèles : chaque classe qui en hérite devient une table."""


def get_db():
    """Ouvre une session pour une requête HTTP, puis la ferme une fois la réponse envoyée."""
    with SessionLocal() as session:
        yield session
