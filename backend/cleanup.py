from sqlmodel import text
from app.db.session import get_session

def cleanup():
    session = next(get_session())
    try:
        print("Deleting user...")
        session.exec(text("DELETE FROM user WHERE email='john2244a@yopmail.com'"))
        print("Deleting tenant...")
        session.exec(text("DELETE FROM tenant WHERE slug='aster'"))
        session.commit()
        print("Cleanup successful")
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    cleanup()
