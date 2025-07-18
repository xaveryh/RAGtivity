from pydantic import BaseModel

class DataItem(BaseModel):
    content: str
    filename: str
    # def __init__(self, content, filename):
        # self.content = content
        # self.filename = filename
