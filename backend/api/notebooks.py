from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from database import get_session
from models import Notebook

router = APIRouter()


class NotebookCreate(BaseModel):
    title: str


@router.get("/notebooks")
def list_notebooks(session: Session = Depends(get_session)):
    return session.exec(select(Notebook).order_by(Notebook.created_at.desc())).all()


@router.post("/notebooks", status_code=201)
def create_notebook(data: NotebookCreate, session: Session = Depends(get_session)):
    notebook = Notebook(title=data.title)
    session.add(notebook)
    session.commit()
    session.refresh(notebook)
    return notebook


@router.get("/notebooks/{notebook_id}")
def get_notebook(notebook_id: str, session: Session = Depends(get_session)):
    notebook = session.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return notebook


@router.patch("/notebooks/{notebook_id}")
def update_notebook(
    notebook_id: str,
    data: NotebookCreate,
    session: Session = Depends(get_session),
):
    notebook = session.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    notebook.title = data.title
    session.commit()
    session.refresh(notebook)
    return notebook


@router.delete("/notebooks/{notebook_id}", status_code=204)
def delete_notebook(notebook_id: str, session: Session = Depends(get_session)):
    notebook = session.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    session.delete(notebook)
    session.commit()
