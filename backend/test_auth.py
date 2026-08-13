from database import SessionLocal
from models.user import User
from schemas.auth import UserResponse

db = SessionLocal()
user = db.query(User).filter(User.id == 1).first()
if user:
    print(user.id, user.email, user.is_guest)
    try:
        ur = UserResponse.model_validate(user)
        print("Schema validation successful:", ur)
    except Exception as e:
        print("Schema error:", e)
else:
    print("User not found")
