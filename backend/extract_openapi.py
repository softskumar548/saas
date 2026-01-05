import json
import os
import sys

# Ensure backend dir is in path
sys.path.append(os.getcwd())

from app.main import app

def extract():
    openapi_data = app.openapi()
    with open("openapi.json", "w") as f:
        json.dump(openapi_data, f, indent=2)
    print("openapi.json extracted successfully")

if __name__ == "__main__":
    extract()
