from fastapi import FastAPI, HTTPException, Query
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime
from collections import defaultdict

load_dotenv()

app = FastAPI(title="Arca Continental - Churn API")

client = MongoClient(os.getenv("MONGO_URI"))
db = client["arca_continental"]

# ── Colecciones ──────────────────────────────────────────────────────────────
ventas_col    = db["ventas"]       # calmonth, customer_id, uni_boxes_sold_m, num_transacciones
clientes_col  = db["clientes"]     # customer_id, tamaño, territorio, etc.
# Si tienes scores pre-calculados de XGBoost, agrega:
# scores_col  = db["churn_scores"]


# ─────────────────────────────────────────────────────────────────────────────
# 1. RESUMEN GENERAL DEL MES
#    GET /resumen/{calmonth}
#    Ejemplo: /resumen/202501
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/resumen/{calmonth}")
def resumen_mes(calmonth: int):
    """
    Devuelve métricas globales de un mes:
    - Total clientes activos
    - Total cajas vendidas
    - Clientes que no compraron ese mes (posible churn)
    """
    # Clientes que SÍ compraron ese mes
    activos = list(ventas_col.find(
        {"calmonth": calmonth, "uni_boxes_sold_m": {"$gt": 0}},
        {"_id": 0, "customer_id": 1, "uni_boxes_sold_m": 1}
    ))

    total_cajas = sum(c["uni_boxes_sold_m"] for c in activos)

    # Clientes que alguna vez compraron pero no este mes
    todos_los_clientes = ventas_col.distinct("customer_id")
    activos_ids = {c["customer_id"] for c in activos}
    inactivos = [cid for cid in todos_los_clientes if cid not in activos_ids]

    return {
        "calmonth": calmonth,
        "clientes_activos": len(activos),
        "total_cajas_vendidas": round(total_cajas, 2),
        "clientes_inactivos_este_mes": len(inactivos),
        "tasa_inactividad_pct": round(len(inactivos) / len(todos_los_clientes) * 100, 2)
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2. CLIENTES EN TENDENCIA NEGATIVA (PRE-CHURN)
#    GET /clientes/en-riesgo?meses=3&umbral_caida=0.3&limit=50
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/clientes/en-riesgo")
def clientes_en_riesgo(
    meses: int = Query(default=3, description="Ventana de meses a analizar"),
    umbral_caida: float = Query(default=0.30, description="% de caída mínima para considerar riesgo (0.3 = 30%)"),
    limit: int = Query(default=50, description="Máximo de resultados")
):
    """
    Detecta clientes cuyas cajas vendidas han caído X% en los últimos N meses.
    No requiere modelo ML — son reglas de negocio directas.
    """
    # Traer todos los registros ordenados por cliente y mes
    pipeline = [
        {"$sort": {"customer_id": 1, "calmonth": 1}},
        {"$group": {
            "_id": "$customer_id",
            "historial": {
                "$push": {
                    "calmonth": "$calmonth",
                    "cajas": "$uni_boxes_sold_m",
                    "transacciones": "$num_transacciones"
                }
            }
        }}
    ]
    registros = list(ventas_col.aggregate(pipeline))

    en_riesgo = []

    for r in registros:
        historial = sorted(r["historial"], key=lambda x: x["calmonth"])
        if len(historial) < meses + 1:
            continue

        # Últimos N meses
        recientes = historial[-(meses):]
        primer_valor = recientes[0]["cajas"]
        ultimo_valor = recientes[-1]["cajas"]

        if primer_valor == 0:
            continue

        caida_pct = (primer_valor - ultimo_valor) / primer_valor

        if caida_pct >= umbral_caida:
            # Calcular meses consecutivos en caída
            meses_caida = 0
            for i in range(len(recientes) - 1, 0, -1):
                if recientes[i]["cajas"] < recientes[i-1]["cajas"]:
                    meses_caida += 1
                else:
                    break

            en_riesgo.append({
                "customer_id": r["_id"],
                "cajas_inicio_periodo": round(primer_valor, 2),
                "cajas_ultimo_mes": round(ultimo_valor, 2),
                "caida_pct": round(caida_pct * 100, 1),
                "meses_consecutivos_bajando": meses_caida,
                "ultimo_mes_registrado": recientes[-1]["calmonth"]
            })

    # Ordenar por mayor caída primero
    en_riesgo.sort(key=lambda x: x["caida_pct"], reverse=True)

    return {
        "total_en_riesgo": len(en_riesgo),
        "parametros": {"meses_analizados": meses, "umbral_caida_pct": umbral_caida * 100},
        "clientes": en_riesgo[:limit]
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. HISTORIAL COMPLETO DE UN CLIENTE
#    GET /cliente/{customer_id}/historial
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/cliente/{customer_id}/historial")
def historial_cliente(customer_id: str):
    """
    Devuelve mes a mes las cajas y transacciones de un cliente,
    más un diagnóstico automático de su tendencia.
    """
    registros = list(ventas_col.find(
        {"customer_id": customer_id},
        {"_id": 0, "calmonth": 1, "uni_boxes_sold_m": 1, "num_transacciones": 1}
    ).sort("calmonth", 1))

    if not registros:
        raise HTTPException(status_code=404, detail=f"Cliente {customer_id} no encontrado")

    # Info del cliente si existe
    info_cliente = clientes_col.find_one(
        {"customer_id": customer_id},
        {"_id": 0}
    ) or {}

    # Calcular variación mes a mes
    historial_con_delta = []
    for i, reg in enumerate(registros):
        delta = None
        if i > 0:
            prev = registros[i-1]["uni_boxes_sold_m"]
            curr = reg["uni_boxes_sold_m"]
            delta = round(((curr - prev) / prev * 100), 1) if prev != 0 else None
        historial_con_delta.append({**reg, "delta_pct_vs_mes_anterior": delta})

    # Diagnóstico simple
    ultimos_3 = [r["uni_boxes_sold_m"] for r in registros[-3:]]
    if len(ultimos_3) >= 3 and ultimos_3[0] > ultimos_3[1] > ultimos_3[2]:
        tendencia = "BAJANDO - 3 meses consecutivos en caída"
    elif registros[-1]["uni_boxes_sold_m"] == 0:
        tendencia = "INACTIVO - sin compras el último mes"
    elif len(ultimos_3) >= 2 and ultimos_3[-1] > ultimos_3[-2]:
        tendencia = "SUBIENDO"
    else:
        tendencia = "ESTABLE"

    return {
        "customer_id": customer_id,
        "info_cliente": info_cliente,
        "tendencia": tendencia,
        "total_meses_con_datos": len(registros),
        "historial": historial_con_delta
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. CLIENTES INACTIVOS (CHURN CONFIRMADO)
#    GET /clientes/inactivos?desde=202401&hasta=202501
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/clientes/inactivos")
def clientes_inactivos(
    desde: int = Query(..., description="Mes inicio YYYYMM"),
    hasta: int = Query(..., description="Mes fin YYYYMM"),
    limit: int = Query(default=100)
):
    """
    Clientes que tuvieron actividad antes de 'desde' pero
    no compraron nada entre 'desde' y 'hasta'.
    """
    # Clientes activos en el rango
    activos_en_rango = set(ventas_col.distinct(
        "customer_id",
        {"calmonth": {"$gte": desde, "$lte": hasta}, "uni_boxes_sold_m": {"$gt": 0}}
    ))

    # Clientes que compraron antes del rango
    compraron_antes = set(ventas_col.distinct(
        "customer_id",
        {"calmonth": {"$lt": desde}, "uni_boxes_sold_m": {"$gt": 0}}
    ))

    # Churn = compraron antes pero no en el rango
    churned = compraron_antes - activos_en_rango

    # Obtener su último mes de compra
    resultado = []
    for cid in list(churned)[:limit]:
        ultimo = ventas_col.find_one(
            {"customer_id": cid, "uni_boxes_sold_m": {"$gt": 0}},
            {"_id": 0, "calmonth": 1, "uni_boxes_sold_m": 1},
            sort=[("calmonth", -1)]
        )
        resultado.append({
            "customer_id": cid,
            "ultimo_mes_activo": ultimo["calmonth"] if ultimo else None,
            "ultimas_cajas": ultimo["uni_boxes_sold_m"] if ultimo else None
        })

    resultado.sort(key=lambda x: x["ultimo_mes_activo"] or 0, reverse=True)

    return {
        "rango": {"desde": desde, "hasta": hasta},
        "total_churned": len(churned),
        "clientes": resultado
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. COMPARATIVA POR TERRITORIO
#    GET /territorio/{territorio}/resumen?calmonth=202501
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/territorio/{territorio}/resumen")
def resumen_territorio(territorio: str, calmonth: int = Query(...)):
    """
    Compara el desempeño de los clientes dentro de un territorio en un mes dado.
    Útil para saber si la caída es del cliente o de toda la zona.
    """
    # Clientes de ese territorio
    clientes_zona = list(clientes_col.find(
        {"territorio": territorio},
        {"_id": 0, "customer_id": 1}
    ))
    ids_zona = [c["customer_id"] for c in clientes_zona]

    if not ids_zona:
        raise HTTPException(status_code=404, detail=f"Territorio '{territorio}' no encontrado o sin clientes")

    # Ventas de ese mes en la zona
    ventas_mes = list(ventas_col.find(
        {"customer_id": {"$in": ids_zona}, "calmonth": calmonth},
        {"_id": 0, "customer_id": 1, "uni_boxes_sold_m": 1, "num_transacciones": 1}
    ))

    activos = [v for v in ventas_mes if v["uni_boxes_sold_m"] > 0]
    total_cajas = sum(v["uni_boxes_sold_m"] for v in activos)

    return {
        "territorio": territorio,
        "calmonth": calmonth,
        "total_clientes_zona": len(ids_zona),
        "clientes_activos_mes": len(activos),
        "clientes_inactivos_mes": len(ids_zona) - len(activos),
        "tasa_actividad_pct": round(len(activos) / len(ids_zona) * 100, 1) if ids_zona else 0,
        "total_cajas_zona": round(total_cajas, 2),
        "promedio_cajas_por_cliente_activo": round(total_cajas / len(activos), 2) if activos else 0
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. HEALTH CHECK
#    GET /health
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    try:
        db.command("ping")
        return {"status": "ok", "mongo": "conectado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
