from app.database import SessionLocal
from app.models import BusinessState


def _load_db() -> dict:
    """Helper to load or initialize the mock database from SQLite."""
    db = SessionLocal()
    try:
        state = db.query(BusinessState).filter(BusinessState.id == 1).first()
        if not state:
            # Initialize with default data if empty
            new_state = BusinessState(id=1, data={})
            db.add(new_state)
            db.commit()
            return {}
        return state.data
    except Exception as e:
        print(f"Error loading database: {e}")
        return {}
    finally:
        db.close()


def _save_db(data: dict) -> None:
    """Helper to save to the mock database in SQLite."""
    db = SessionLocal()
    try:
        state = db.query(BusinessState).filter(BusinessState.id == 1).first()
        if state:
            state.data = data
        else:
            state = BusinessState(id=1, data=data)
            db.add(state)
        db.commit()
    except Exception as e:
        print(f"Error saving database: {e}")
        db.rollback()
    finally:
        db.close()


# --- Core Business Data Tools ---
