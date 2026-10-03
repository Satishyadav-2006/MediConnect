import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import Document, init_beanie
from typing import List, Type

from app.core.config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient | None = None
database = None


async def connect_db() -> None:
    global client, database
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")
        database = client[settings.DATABASE_NAME]
        logger.info("Connected to MongoDB: %s", settings.DATABASE_NAME)
    except Exception as e:
        logger.critical("Failed to connect to MongoDB: %s", e)
        raise


async def init_beanie_models(document_models: List[Type[Document]]) -> None:
    global client, database
    if client is None or database is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    await init_beanie(database=database, document_models=document_models)
    logger.info("Beanie initialized with %d document models", len(document_models))


async def disconnect_db() -> None:
    global client, database
    if client:
        client.close()
        logger.info("Disconnected from MongoDB")
    client = None
    database = None


async def get_database():
    if database is None:
        raise RuntimeError("Database not connected.")
    return database
