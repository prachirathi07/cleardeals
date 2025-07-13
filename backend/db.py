from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./leads.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    phone = Column(String)
    initial_score = Column(Integer)
    reranked_score = Column(Integer)
    intent_level = Column(String)
    comments = Column(Text)
    timestamp = Column(String)

Base.metadata.create_all(bind=engine) 