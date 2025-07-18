import requests

url = "http://127.0.0.1:8000"
file_path = "sl_booklet.pdf"

with open(file_path, "rb") as f:
    files = {"file": ("sl_booklet.pdf", f, "application/pdf")}
    response = requests.post(url, files=files)

chunked = response.json()["chunked"]

response = requests.post("http://127.0.0.1:8001", json={"item": chunked[0]})

print(response.json())