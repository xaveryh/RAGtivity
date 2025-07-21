from pydantic import BaseModel

class DataItem(BaseModel):
    content: str
    filename: str