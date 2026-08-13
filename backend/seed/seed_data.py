import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
# from models.your_model import YourModel

def seed():
    db = SessionLocal()
    try:
        print("Seeding database...")
        # Add your seed logic here
        # example:
        # new_record = YourModel(name="test")
        # db.add(new_record)
        # db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
