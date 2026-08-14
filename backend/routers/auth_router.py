from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from datetime import timedelta

from db import get_db, first_row
from schemas.auth import UserCreate, UserLogin, UserSync, Token, UserResponse, UserInfo
from services.auth_service import (
    verify_password, get_password_hash, create_access_token,
    verify_token, ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db=Depends(get_db),
) -> UserInfo:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    rs = await db.execute("SELECT * FROM users WHERE id = ?", [int(user_id)])
    user = first_row(rs)
    if user is None:
        raise credentials_exception
    return UserInfo(
        id=user["id"],
        email=user["email"],
        is_guest=bool(user["is_guest"]),
        hashed_password=user["hashed_password"],
        google_id=user["google_id"],
    )


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db=Depends(get_db)):
    rs = await db.execute("SELECT id FROM users WHERE email = ?", [user_data.email])
    if first_row(rs):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = get_password_hash(user_data.password)
    await db.execute(
        "INSERT INTO users (email, hashed_password) VALUES (?, ?)",
        [user_data.email, hashed_pwd],
    )
    rs = await db.execute("SELECT last_insert_rowid() AS id")
    new_id = first_row(rs)["id"]

    token = create_access_token(
        data={"sub": str(new_id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db=Depends(get_db)):
    rs = await db.execute("SELECT * FROM users WHERE email = ?", [user_data.email])
    user = first_row(rs)
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        data={"sub": str(user["id"])},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/sync", response_model=Token)
async def sync_oauth_user(user_data: UserSync, db=Depends(get_db)):
    rs = await db.execute("SELECT * FROM users WHERE google_id = ?", [user_data.google_id])
    user = first_row(rs)

    if not user:
        rs = await db.execute("SELECT * FROM users WHERE email = ?", [user_data.email])
        user = first_row(rs)
        if user:
            await db.execute(
                "UPDATE users SET google_id = ? WHERE id = ?",
                [user_data.google_id, user["id"]],
            )
        else:
            await db.execute(
                "INSERT INTO users (email, google_id) VALUES (?, ?)",
                [user_data.email, user_data.google_id],
            )
            rs = await db.execute("SELECT last_insert_rowid() AS id")
            user = {"id": first_row(rs)["id"]}

    token = create_access_token(
        data={"sub": str(user["id"])},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/guest", response_model=Token)
async def guest_login(db=Depends(get_db)):
    rs = await db.execute("SELECT id FROM users WHERE is_guest = 1 LIMIT 1")
    guest = first_row(rs)

    if not guest:
        await db.execute(
            "INSERT INTO users (email, is_guest) VALUES (?, 1)",
            ["guest@typeformclone.local"],
        )
        rs = await db.execute("SELECT last_insert_rowid() AS id")
        guest = first_row(rs)

    token = create_access_token(
        data={"sub": str(guest["id"])},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: UserInfo = Depends(get_current_user)):
    return UserResponse(id=current_user.id, email=current_user.email, is_guest=current_user.is_guest)
