from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from db import get_db, rows_to_dicts, first_row
from schemas.form import (
    FormCreate, FormResponse, QuestionResponse, QuestionChoiceResponse,
    ResponseCreate, ResponseResponse, AnswerResponse,
)
from schemas.auth import UserInfo
from routers.auth_router import get_current_user

router = APIRouter(prefix="/forms", tags=["Forms"])


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _build_form_response(db, form: dict) -> FormResponse:
    """Fetch questions+choices for a form and return a FormResponse."""
    rs = await db.execute(
        'SELECT * FROM questions WHERE form_id = ? ORDER BY "order"', [form["id"]]
    )
    questions_raw = rows_to_dicts(rs)

    questions = []
    for q in questions_raw:
        rs2 = await db.execute(
            'SELECT * FROM question_choices WHERE question_id = ? ORDER BY "order"', [q["id"]]
        )
        choices = [
            QuestionChoiceResponse(
                id=c["id"], question_id=c["question_id"],
                text=c["text"], order=c["order"]
            )
            for c in rows_to_dicts(rs2)
        ]
        questions.append(QuestionResponse(
            id=q["id"],
            form_id=q["form_id"],
            text=q["text"],
            type=q["type"],
            order=q["order"],
            is_required=bool(q["is_required"]),
            choices=choices,
        ))

    return FormResponse(
        id=form["id"],
        title=form["title"],
        description=form["description"],
        is_published=bool(form["is_published"]),
        created_at=form["created_at"],
        updated_at=form.get("updated_at"),
        questions=questions,
    )


async def _insert_questions(db, form_id: int, questions_in):
    for q_in in questions_in:
        rs = await db.execute(
            'INSERT INTO questions (form_id, text, type, "order", is_required) VALUES (?,?,?,?,?) RETURNING id',
            [form_id, q_in.text, q_in.type.value, q_in.order, int(q_in.is_required)],
        )
        q_id = first_row(rs)["id"]

        if q_in.choices:
            for c_in in q_in.choices:
                await db.execute(
                    'INSERT INTO question_choices (question_id, text, "order") VALUES (?,?,?)',
                    [q_id, c_in.text, c_in.order],
                )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[FormResponse])
async def get_forms(
    skip: int = 0, limit: int = 100,
    db=Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    rs = await db.execute(
        "SELECT * FROM forms WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?",
        [current_user.id, limit, skip],
    )
    return [await _build_form_response(db, f) for f in rows_to_dicts(rs)]


@router.get("/{form_id}", response_model=FormResponse)
async def get_form(form_id: int, db=Depends(get_db)):
    rs = await db.execute("SELECT * FROM forms WHERE id = ?", [form_id])
    form = first_row(rs)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return await _build_form_response(db, form)


@router.post("/", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
async def create_form(
    form_in: FormCreate,
    db=Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    rs = await db.execute(
        "INSERT INTO forms (title, description, is_published, user_id) VALUES (?,?,?,?) RETURNING id",
        [form_in.title, form_in.description, int(form_in.is_published), current_user.id],
    )
    form_id_new = first_row(rs)["id"]

    if form_in.questions:
        await _insert_questions(db, form_id_new, form_in.questions)

    rs = await db.execute("SELECT * FROM forms WHERE id = ?", [form_id_new])
    return await _build_form_response(db, first_row(rs))


@router.put("/{form_id}", response_model=FormResponse)
async def update_form(
    form_id: int,
    form_in: FormCreate,
    db=Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    rs = await db.execute("SELECT * FROM forms WHERE id = ?", [form_id])
    form = first_row(rs)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.execute(
        "UPDATE forms SET title=?, description=?, is_published=?, updated_at=datetime('now') WHERE id=?",
        [form_in.title, form_in.description, int(form_in.is_published), form_id],
    )
    # Delete answers and responses first to avoid foreign key constraint errors
    await db.execute(
        "DELETE FROM answers WHERE question_id IN (SELECT id FROM questions WHERE form_id = ?)", 
        [form_id]
    )
    await db.execute("DELETE FROM responses WHERE form_id = ?", [form_id])
    await db.execute(
        "DELETE FROM question_choices WHERE question_id IN (SELECT id FROM questions WHERE form_id = ?)",
        [form_id]
    )
    await db.execute("DELETE FROM questions WHERE form_id = ?", [form_id])

    if form_in.questions:
        await _insert_questions(db, form_id, form_in.questions)

    rs = await db.execute("SELECT * FROM forms WHERE id = ?", [form_id])
    return await _build_form_response(db, first_row(rs))


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(
    form_id: int,
    db=Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    rs = await db.execute("SELECT user_id FROM forms WHERE id = ?", [form_id])
    form = first_row(rs)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.execute("DELETE FROM forms WHERE id = ?", [form_id])
    return None


@router.post("/{form_id}/duplicate", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_form(
    form_id: int,
    db=Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    rs = await db.execute("SELECT * FROM forms WHERE id = ?", [form_id])
    original = first_row(rs)
    if not original:
        raise HTTPException(status_code=404, detail="Form not found")
    if original["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    rs = await db.execute(
        "INSERT INTO forms (title, description, is_published, user_id) VALUES (?,?,0,?) RETURNING id",
        [f"{original['title']} (Copy)", original["description"], current_user.id],
    )
    new_form_id = first_row(rs)["id"]

    rs = await db.execute('SELECT * FROM questions WHERE form_id = ? ORDER BY "order"', [form_id])
    for q in rows_to_dicts(rs):
        rs2 = await db.execute(
            'INSERT INTO questions (form_id, text, type, "order", is_required) VALUES (?,?,?,?,?) RETURNING id',
            [new_form_id, q["text"], q["type"], q["order"], q["is_required"]],
        )
        new_q_id = first_row(rs2)["id"]
        rs3 = await db.execute(
            'SELECT * FROM question_choices WHERE question_id = ? ORDER BY "order"', [q["id"]]
        )
        for c in rows_to_dicts(rs3):
            await db.execute(
                'INSERT INTO question_choices (question_id, text, "order") VALUES (?,?,?)',
                [new_q_id, c["text"], c["order"]],
            )

    rs = await db.execute("SELECT * FROM forms WHERE id = ?", [new_form_id])
    return await _build_form_response(db, first_row(rs))


# ── Responses ─────────────────────────────────────────────────────────────────

@router.post("/{form_id}/responses", response_model=ResponseResponse, status_code=status.HTTP_201_CREATED)
async def submit_response(form_id: int, response_in: ResponseCreate, db=Depends(get_db)):
    rs = await db.execute("SELECT id FROM forms WHERE id = ?", [form_id])
    if not first_row(rs):
        raise HTTPException(status_code=404, detail="Form not found")

    rs = await db.execute("INSERT INTO responses (form_id) VALUES (?) RETURNING id", [form_id])
    resp_id = first_row(rs)["id"]
    rs = await db.execute("SELECT * FROM responses WHERE id = ?", [resp_id])
    resp = first_row(rs)

    for ans in response_in.answers:
        await db.execute(
            "INSERT INTO answers (response_id, question_id, text_value) VALUES (?,?,?)",
            [resp["id"], ans.question_id, ans.text_value],
        )

    rs = await db.execute("SELECT * FROM answers WHERE response_id = ?", [resp["id"]])
    answers = [
        AnswerResponse(
            id=a["id"], response_id=a["response_id"],
            question_id=a["question_id"], text_value=a["text_value"]
        )
        for a in rows_to_dicts(rs)
    ]
    return ResponseResponse(
        id=resp["id"],
        form_id=resp["form_id"],
        created_at=resp["created_at"],
        answers=answers,
    )


@router.get("/{form_id}/responses", response_model=List[ResponseResponse])
async def get_form_responses(
    form_id: int,
    db=Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    rs = await db.execute("SELECT user_id FROM forms WHERE id = ?", [form_id])
    form = first_row(rs)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    rs = await db.execute("SELECT * FROM responses WHERE form_id = ? ORDER BY id DESC", [form_id])
    results = []
    for resp in rows_to_dicts(rs):
        rs2 = await db.execute("SELECT * FROM answers WHERE response_id = ?", [resp["id"]])
        answers = [
            AnswerResponse(
                id=a["id"], response_id=a["response_id"],
                question_id=a["question_id"], text_value=a["text_value"]
            )
            for a in rows_to_dicts(rs2)
        ]
        results.append(ResponseResponse(
            id=resp["id"],
            form_id=resp["form_id"],
            created_at=resp["created_at"],
            answers=answers,
        ))
    return results
