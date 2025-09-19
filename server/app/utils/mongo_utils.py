"""MongoDB utility helpers for centralized connection management.

Provides:
- connect_to_mongodb: returns (client, db, collection_name)
- get_db_connection: returns db only (for legacy helpers)
"""

from pymongo import MongoClient
from typing import Optional, Tuple
from app.config import Config


def connect_to_mongodb(
    collection_config_attr: Optional[str] = None,
    fallback_collection: Optional[str] = None,
) -> Tuple[Optional[MongoClient], Optional[object], Optional[str]]:
    """Create a MongoDB connection and return (client, db, collection_name).

    Args:
        collection_config_attr: Name of the attribute in Config that contains the
            collection name (e.g., "MONGODB_ROADMAP_COLLECTION"). If provided, the
            collection name will be read from Config using this attribute.
        fallback_collection: Used when collection_config_attr is None or not found.

    Returns:
        (client, db, collection_name) — any of these may be None if connection fails
    """
    try:
        connection_string = Config.MONGODB_URI
        db_name = Config.MONGODB_DB_NAME

        if not connection_string or not db_name:
            return None, None, None

        client = MongoClient(connection_string)
        # Validate connection
        client.admin.command("ping")

        db = client[db_name]
        collection_name = None
        if collection_config_attr:
            collection_name = getattr(Config, collection_config_attr, None)
        if not collection_name:
            collection_name = fallback_collection

        return client, db, collection_name
    except Exception:
        return None, None, None


def get_db_connection():
    """Return only the database object (legacy compatibility).

    Returns:
        db or None if connection fails
    """
    client, db, _ = connect_to_mongodb()
    return db
