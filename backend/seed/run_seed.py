import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine, Base
import models.form as models
import json

def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("Clearing existing data...")
        db.query(models.Answer).delete()
        db.query(models.Response).delete()
        db.query(models.QuestionChoice).delete()
        db.query(models.Question).delete()
        db.query(models.Form).delete()
        db.commit()

        print("Seeding new data...")
        
        # 1. Product Feedback Form
        f1 = models.Form(
            title="Product Feedback Survey",
            description="Help us improve our product by providing your valuable feedback.",
            is_published=True
        )
        db.add(f1)
        db.commit()
        db.refresh(f1)

        q1 = models.Question(
            form_id=f1.id,
            text="What is your overall satisfaction with our product?",
            type=models.QuestionType.single_choice,
            order=1,
            is_required=True
        )
        db.add(q1)
        db.commit()
        db.refresh(q1)
        
        for idx, text in enumerate(["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"]):
            db.add(models.QuestionChoice(question_id=q1.id, text=text, order=idx))

        q2 = models.Question(
            form_id=f1.id,
            text="What features do you use most often?",
            type=models.QuestionType.multiple_choice,
            order=2,
            is_required=False
        )
        db.add(q2)
        db.commit()
        db.refresh(q2)
        
        for idx, text in enumerate(["Dashboard", "Reports", "Settings", "Export"]):
            db.add(models.QuestionChoice(question_id=q2.id, text=text, order=idx))
            
        q3 = models.Question(
            form_id=f1.id,
            text="Any additional comments?",
            type=models.QuestionType.long_text,
            order=3,
            is_required=False
        )
        db.add(q3)
        db.commit()
        
        # 2. Event Registration Form
        f2 = models.Form(
            title="Tech Meetup Registration",
            description="Register for the upcoming tech meetup in your area.",
            is_published=True
        )
        db.add(f2)
        db.commit()
        db.refresh(f2)
        
        db.add(models.Question(
            form_id=f2.id,
            text="What is your full name?",
            type=models.QuestionType.text,
            order=1,
            is_required=True
        ))
        
        db.add(models.Question(
            form_id=f2.id,
            text="Why do you want to attend?",
            type=models.QuestionType.long_text,
            order=2,
            is_required=False
        ))
        db.commit()

        # Add a dummy response
        resp1 = models.Response(form_id=f1.id)
        db.add(resp1)
        db.commit()
        db.refresh(resp1)
        
        db.add(models.Answer(response_id=resp1.id, question_id=q1.id, text_value="Satisfied"))
        db.add(models.Answer(response_id=resp1.id, question_id=q2.id, text_value=json.dumps(["Dashboard", "Export"])))
        db.add(models.Answer(response_id=resp1.id, question_id=q3.id, text_value="Looks great so far!"))
        db.commit()

        print("Seeding complete!")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
