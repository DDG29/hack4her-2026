from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Permitir conexión desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conectar a MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client["hack4her"]
stores_collection = db["stores"]

# Endpoint: Obtener todos los stores
@app.get("/api/stores")
def get_stores():
    try:
        stores = list(stores_collection.find({}, {"_id": 0}))
        print(f"📊 Stores encontrados: {len(stores)}")
        return stores
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"error": str(e)}

# Endpoint: Obtener un store por ID
@app.get("/api/stores/{store_id}")
def get_store(store_id: str):
    try:
        store = stores_collection.find_one({"id": store_id}, {"_id": 0})
        if store:
            return store
        return {"error": f"Store {store_id} no encontrado"}
    except Exception as e:
        return {"error": str(e)}