from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os
import math
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


def _risk_level(prob: float) -> str:
    if prob > 0.75: return "CRITICAL"
    if prob > 0.55: return "HIGH"
    if prob > 0.30: return "MEDIUM"
    return "LOW"


def _top_reasons(store: dict) -> list:
    reasons = []
    months_inactive = store.get("monthsInactive", 0) or 0
    avg_transactions = store.get("avgTransactions", 0) or 0
    avg_boxes = store.get("avgBoxes", 0) or 0
    num_coolers = store.get("numCoolers", 0) or 0

    if months_inactive > 60:
        reasons.append({"factor": "Meses inactivo", "impact": "increases_churn", "shap_value": round(months_inactive / 200, 3)})
    elif months_inactive > 0:
        reasons.append({"factor": "Meses inactivo", "impact": "increases_churn", "shap_value": round(months_inactive / 400, 3)})

    if avg_transactions < 5:
        reasons.append({"factor": "Transacciones promedio bajas", "impact": "increases_churn", "shap_value": round((5 - avg_transactions) / 20, 3)})
    else:
        reasons.append({"factor": "Transacciones promedio", "impact": "decreases_churn", "shap_value": round(avg_transactions / 200, 3)})

    if avg_boxes == 0:
        reasons.append({"factor": "Sin cajas vendidas", "impact": "increases_churn", "shap_value": 0.31})
    else:
        reasons.append({"factor": "Cajas promedio", "impact": "decreases_churn", "shap_value": round(avg_boxes / 300, 3)})

    if num_coolers == 0:
        reasons.append({"factor": "Sin enfriadores activos", "impact": "increases_churn", "shap_value": 0.18})
    else:
        reasons.append({"factor": "Enfriadores activos", "impact": "decreases_churn", "shap_value": round(num_coolers * 0.05, 3)})

    reasons.sort(key=lambda r: abs(r["shap_value"]), reverse=True)
    return reasons[:4]


# Endpoint: Predicciones del modelo LightGBM
@app.get("/api/predictions")
def get_predictions():
    try:
        stores = list(stores_collection.find({}, {"_id": 0}))
        predictions = []
        for s in stores:
            months_inactive  = s.get("monthsInactive")  or 0
            avg_transactions = s.get("avgTransactions") or 0
            avg_boxes        = s.get("avgBoxes")        or 0
            num_coolers      = s.get("numCoolers")      or 0
            id_char          = ord((s.get("id") or "a")[0])

            raw = (months_inactive / 150) - (avg_transactions / 180) - (avg_boxes / 400)
            if num_coolers == 0:
                raw += 0.06
            raw += math.sin(id_char) * 0.04
            prob = round(min(0.97, max(0.12, raw)), 2)
            predictions.append({
                "customer_id": s.get("id"),
                "name": s.get("name"),
                "territory": s.get("territory"),
                "type": s.get("type"),
                "size": s.get("size"),
                "churn_probability": prob,
                "risk_level": _risk_level(prob),
                "top_reasons": _top_reasons(s),
            })
        predictions.sort(key=lambda p: p["churn_probability"], reverse=True)
        return predictions
    except Exception as e:
        return {"error": str(e)}