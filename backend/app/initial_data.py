import logging
from sqlmodel import Session, SQLModel
from app.db.session import engine
from app.db.init_db import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init():
    # Create Tables
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        init_db(session)

def main():
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created")

if __name__ == "__main__":
    main()
