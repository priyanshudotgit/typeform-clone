from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models.form as models
import schemas.form as schemas
from models.user import User
from routers.auth_router import get_current_user

router = APIRouter(
    prefix="/forms",
    tags=["Forms"]
)

@router.get("/", response_model=List[schemas.FormResponse])
def get_forms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    forms = db.query(models.Form).filter(models.Form.user_id == current_user.id).offset(skip).limit(limit).all()
    return forms

@router.get("/{form_id}", response_model=schemas.FormResponse)
def get_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@router.post("/", response_model=schemas.FormResponse, status_code=status.HTTP_201_CREATED)
def create_form(form_in: schemas.FormCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_form = models.Form(
        title=form_in.title,
        description=form_in.description,
        is_published=form_in.is_published,
        user_id=current_user.id
    )
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    
    # Add questions if provided
    if form_in.questions:
        for q_in in form_in.questions:
            db_q = models.Question(
                form_id=db_form.id,
                text=q_in.text,
                type=q_in.type,
                order=q_in.order,
                is_required=q_in.is_required
            )
            db.add(db_q)
            db.commit()
            db.refresh(db_q)
            
            if q_in.choices:
                for c_in in q_in.choices:
                    db_c = models.QuestionChoice(
                        question_id=db_q.id,
                        text=c_in.text,
                        order=c_in.order
                    )
                    db.add(db_c)
                db.commit()

    db.refresh(db_form)
    return db_form

@router.put("/{form_id}", response_model=schemas.FormResponse)
def update_form(form_id: int, form_in: schemas.FormCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    if db_form.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_form.title = form_in.title
    db_form.description = form_in.description
    db_form.is_published = form_in.is_published
    
    # For a full update, delete existing questions using ORM to trigger cascade (deletes choices)
    for q in list(db_form.questions):
        db.delete(q)
    db.commit()
    
    if form_in.questions:
        for q_in in form_in.questions:
            db_q = models.Question(
                form_id=db_form.id,
                text=q_in.text,
                type=q_in.type,
                order=q_in.order,
                is_required=q_in.is_required
            )
            db.add(db_q)
            db.commit()
            db.refresh(db_q)
            
            if q_in.choices:
                for c_in in q_in.choices:
                    db_c = models.QuestionChoice(
                        question_id=db_q.id,
                        text=c_in.text,
                        order=c_in.order
                    )
                    db.add(db_c)
                db.commit()
                
    db.refresh(db_form)
    return db_form

@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(form_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    if db_form.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(db_form)
    db.commit()
    return None

@router.post("/{form_id}/duplicate", response_model=schemas.FormResponse, status_code=status.HTTP_201_CREATED)
def duplicate_form(form_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    original_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not original_form:
        raise HTTPException(status_code=404, detail="Form not found")
    if original_form.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Create new form
    new_form = models.Form(
        title=f"{original_form.title} (Copy)",
        description=original_form.description,
        is_published=False, # default to unpublished
        user_id=current_user.id
    )
    db.add(new_form)
    db.commit()
    db.refresh(new_form)
    
    # Copy questions
    original_questions = db.query(models.Question).filter(models.Question.form_id == form_id).all()
    for q in original_questions:
        new_q = models.Question(
            form_id=new_form.id,
            text=q.text,
            type=q.type,
            order=q.order,
            is_required=q.is_required
        )
        db.add(new_q)
        db.commit()
        db.refresh(new_q)
        
        # Copy choices
        original_choices = db.query(models.QuestionChoice).filter(models.QuestionChoice.question_id == q.id).all()
        for c in original_choices:
            new_c = models.QuestionChoice(
                question_id=new_q.id,
                text=c.text,
                order=c.order
            )
            db.add(new_c)
        db.commit()
        
    db.refresh(new_form)
    return new_form

# --- Responses endpoints ---

@router.post("/{form_id}/responses", response_model=schemas.ResponseResponse, status_code=status.HTTP_201_CREATED)
def submit_response(form_id: int, response_in: schemas.ResponseCreate, db: Session = Depends(get_db)):
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    db_resp = models.Response(form_id=form_id)
    db.add(db_resp)
    db.commit()
    db.refresh(db_resp)
    
    for ans_in in response_in.answers:
        db_ans = models.Answer(
            response_id=db_resp.id,
            question_id=ans_in.question_id,
            text_value=ans_in.text_value
        )
        db.add(db_ans)
    
    db.commit()
    db.refresh(db_resp)
    return db_resp

@router.get("/{form_id}/responses", response_model=List[schemas.ResponseResponse])
def get_form_responses(form_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    if db_form.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    responses = db.query(models.Response).filter(models.Response.form_id == form_id).all()
    return responses
