import pandas as pd
import numpy as np
import joblib
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, roc_auc_score,
    average_precision_score
)
from sklearn.preprocessing import LabelEncoder
from imblearn.over_sampling import SMOTE
import lightgbm as lgb
import warnings
warnings.filterwarnings("ignore")
 
MODEL_OUT     = "churn_model.pkl"
EXPLAINER_OUT = "shap_explainer.pkl"
 
# ── Data from CSVs ────────────────────────────────────────────────────
print("Loading data from CSVs…")
sales     = pd.read_csv("/Users/doriandanielagonzalez/hack4her-2026/app/model/sales_churn_train.csv")
customers = pd.read_csv("/Users/doriandanielagonzalez/hack4her-2026/app/model/Clientes.csv")
coolers   = pd.read_csv("/Users/doriandanielagonzalez/hack4her-2026/app/model/Coolers.csv")
test      = pd.read_csv("/Users/doriandanielagonzalez/hack4her-2026/app/model/sales_churn_test.csv")
 
# Everything is lowercase and blank stripped for easier handling
sales.columns     = sales.columns.str.strip().str.lower()
customers.columns = customers.columns.str.strip().str.lower()
coolers.columns   = coolers.columns.str.strip().str.lower()
test.columns      = test.columns.str.strip().str.lower()
 
# Renamed columns for a better readability
customers = customers.rename(columns={
    "territory_d":            "territory",
    "comercial_subchannel_d": "subchannel",
    "rtm_customer_size_d":    "customer_size",
})
 
# Renaming target column to a more intuitive name and converting to boolean
sales = sales.rename(columns={"target": "churn_label"})
sales["churn_label"] = sales["churn_label"].astype(bool)
 
 #confirm data loaded
print(f"  sales_train: {len(sales):,} rows")
print(f"  customers:   {len(customers):,} rows")
print(f"  coolers:     {len(coolers):,} rows")
print(f"  test:        {len(test):,} rows")
 
 # ── Data Cleaning ─────────────────────────────────────────────────────────────
print("Cleaning data…")

# Fix negative boxes (returns/credits) — clamp to 0
sales["uni_boxes_sold_m"] = sales["uni_boxes_sold_m"].clip(lower=0)

# Remove rows where transactions and boxes are both exactly 0 on non-churn rows
# (these are ghost/inactive records, not real customers)
sales = sales[~((sales["num_transacciones"] == 0) & 
                (sales["uni_boxes_sold_m"] == 0) & 
                (sales["churn_label"] == 0))]

# Cap extreme outliers at 99th percentile
for col in ["num_transacciones", "uni_boxes_sold_m"]:
    cap = sales[col].quantile(0.99)
    sales[col] = sales[col].clip(upper=cap)

# Drop duplicate customer+month combinations if any
sales = sales.drop_duplicates(subset=["customer_id", "calmonth"])

# Fill missing customer_size with "unknown" (already done later but do it early)
customers["customer_size"] = customers["customer_size"].fillna("unknown")

print(f"  After cleaning: {len(sales):,} rows")
 
# ── Cooler features ────────────────────────────────────────────────────────
print("\nEngineering cooler features…")
coolers["num_coolers"] = coolers["num_coolers"].fillna(0) # Assuming missing means 0 coolers
latest_coolers = (
    coolers.sort_values("calmonth") # Ensure we get the latest month per customer
    .groupby("customer_id") # Group by customer
    .last() # Take the last entry (latest month) for each customer
    .reset_index()[["customer_id", "num_coolers", "num_doors"]] # keep only relevant columns
    .rename(columns={"num_coolers": "latest_coolers", "num_doors": "latest_doors"}) # Rename for clarity
)
customers = customers.merge(latest_coolers, on="customer_id", how="left") # Merge with customers, keeping all customers
customers["latest_coolers"] = customers["latest_coolers"].fillna(0) # Fill missing with 0
customers["latest_doors"]   = customers["latest_doors"].fillna(0) # Fill missing with 0
 
 
# ── Sales ──────────────────────────────────────────
print("Engineering sales features…")
 
sales = sales.sort_values(["customer_id", "calmonth"])
sales["churn_label_next"] = sales.groupby("customer_id")["churn_label"].shift(-1) # Next month's churn label (target for current month)
 
sales["transactions_lag1"]  = grp["num_transacciones"].shift(1) # Previous month's transactions
sales["transactions_lag2"]  = grp["num_transacciones"].shift(2) # Two months ago transactions
sales["boxes_lag1"]         = grp["uni_boxes_sold_m"].shift(1) # Previous month's boxes sold
sales["boxes_lag2"]         = grp["uni_boxes_sold_m"].shift(2) # Two months ago boxes sold
 
sales["transactions_roll3"] = grp["num_transacciones"].transform(
    lambda x: x.shift(1).rolling(3, min_periods=1).mean() # 3-month rolling average of transactions, shifted by 1 to avoid leakage
)
sales["boxes_roll3"] = grp["uni_boxes_sold_m"].transform(
    lambda x: x.shift(1).rolling(3, min_periods=1).mean() # 3-month rolling average of boxes sold, shifted by 1 to avoid leakage
)
 
sales["transactions_mom_pct"] = (# Month-over-month percentage change in transactions
    (sales["num_transacciones"] - sales["transactions_lag1"])
    / (sales["transactions_lag1"] + 1e-9) 
)
sales["boxes_mom_pct"] = (# Month-over-month percentage change in boxes sold
    (sales["uni_boxes_sold_m"] - sales["boxes_lag1"])
    / (sales["boxes_lag1"] + 1e-9)
)
 
sales["low_activity"] = (sales["num_transacciones"] < 5).astype(int) # Flag for low activity (less than 5 transactions)
sales["low_activity_streak"] = grp["low_activity"].transform(
    lambda x: x.groupby((x != x.shift()).cumsum()).cumcount() + 1
) * sales["low_activity"]
 
sales["tenure_months"] = grp.cumcount() + 1 # Number of months since first transaction
 
# Merge customer profile
sales = sales.merge(
    customers[["customer_id", "territory", "subchannel", "customer_size",
               "latest_coolers", "latest_doors"]],
    on="customer_id", how="left"
)
 
# Encode categoricals
for col in ["territory", "subchannel", "customer_size"]:
    sales[col] = sales[col].fillna("unknown")
    le = LabelEncoder()
    sales[col + "_enc"] = le.fit_transform(sales[col].astype(str))
 
 
# ── 4. Feature matrix ─────────────────────────────────────────────────────────
FEATURE_COLS = [
    "transactions_lag1", "transactions_lag2",
    "boxes_lag1", "boxes_lag2",
    "transactions_roll3", "boxes_roll3",
    "transactions_mom_pct", "boxes_mom_pct",
    "low_activity", "low_activity_streak",
    "tenure_months", "latest_coolers", "latest_doors",
    "territory_enc", "subchannel_enc", "customer_size_enc",
]
 
df_model = sales[FEATURE_COLS + ["churn_label", "customer_id", "calmonth"]].dropna(
    subset=FEATURE_COLS
)
 
X = df_model[FEATURE_COLS]
y = df_model["churn_label"].astype(int)
 
print(f"  Feature matrix: {X.shape}")
print(f"  Churn rate: {y.mean()*100:.2f}%  ({y.sum():,} / {len(y):,})")
 
 
# ── 5. Train / Test Split (by customer, no leakage) ───────────────────────────
unique_customers = df_model["customer_id"].unique()
train_custs, test_custs = train_test_split(
    unique_customers, test_size=0.2, random_state=42
)
train_mask = df_model["customer_id"].isin(train_custs)
test_mask  = df_model["customer_id"].isin(test_custs)
 
X_train, y_train = X[train_mask], y[train_mask]
X_test,  y_test  = X[test_mask],  y[test_mask]
print(f"  Train: {len(X_train):,} | Test: {len(X_test):,}")
 
 
# ── 6. SMOTE ──────────────────────────────────────────────────────────────────
print("\nApplying SMOTE…")
smote = SMOTE(sampling_strategy=0.3, random_state=42)
X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)
print(f"  After SMOTE: {y_train_bal.sum():,} churn / {len(y_train_bal):,} total")
 
 
# ── 7. Train LightGBM ─────────────────────────────────────────────────────────
print("\nTraining LightGBM…")
model = lgb.LGBMClassifier(
    n_estimators=500, learning_rate=0.05, max_depth=6,
    num_leaves=63, min_child_samples=50, subsample=0.8,
    colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=0.1,
    random_state=42, n_jobs=-1, verbose=-1,
)
model.fit(
    X_train_bal, y_train_bal,
    eval_set=[(X_test, y_test)],
    callbacks=[lgb.early_stopping(50, verbose=False), lgb.log_evaluation(100)]
)
print(f"  Best iteration: {model.best_iteration_}")
 
 
# ── 8. Evaluate ───────────────────────────────────────────────────────────────
print("\n── Evaluation ────────────────────────────────────────────────────────")
y_pred  = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]
print(classification_report(y_test, y_pred, target_names=["active", "churn"]))
print(f"ROC-AUC:           {roc_auc_score(y_test, y_proba):.4f}")
print(f"Avg Precision:     {average_precision_score(y_test, y_proba):.4f}")
 
 
# ── 9. SHAP ───────────────────────────────────────────────────────────────────
print("\nBuilding SHAP explainer…")
explainer   = shap.TreeExplainer(model)
shap_sample = X_test.sample(min(2000, len(X_test)), random_state=42)
shap_values = explainer.shap_values(shap_sample)
 
print("  Top features (SHAP):")
mean_abs_shap = pd.Series(
    np.abs(shap_values).mean(axis=0), index=FEATURE_COLS
).sort_values(ascending=False)
print(mean_abs_shap.head(10).to_string())
 
 
# ── 10. Predict on test CSV ───────────────────────────────────────────────────
print("\nGenerating predictions on test set…")
 
test = test.sort_values(["customer_id", "calmonth"]).reset_index(drop=True)
tgrp = test.groupby("customer_id")
 
test["transactions_lag1"]     = tgrp["num_transacciones"].shift(1)
test["transactions_lag2"]     = tgrp["num_transacciones"].shift(2)
test["boxes_lag1"]            = tgrp["uni_boxes_sold_m"].shift(1)
test["boxes_lag2"]            = tgrp["uni_boxes_sold_m"].shift(2)
test["transactions_roll3"]    = tgrp["num_transacciones"].transform(
    lambda x: x.shift(1).rolling(3, min_periods=1).mean()
)
test["boxes_roll3"]           = tgrp["uni_boxes_sold_m"].transform(
    lambda x: x.shift(1).rolling(3, min_periods=1).mean()
)
test["transactions_mom_pct"]  = (
    (test["num_transacciones"] - test["transactions_lag1"])
    / (test["transactions_lag1"] + 1e-9)
)
test["boxes_mom_pct"]         = (
    (test["uni_boxes_sold_m"] - test["boxes_lag1"])
    / (test["boxes_lag1"] + 1e-9)
)
test["low_activity"]          = (test["num_transacciones"] < 5).astype(int)
test["low_activity_streak"]   = tgrp["low_activity"].transform(
    lambda x: x.groupby((x != x.shift()).cumsum()).cumcount() + 1
) * test["low_activity"]
test["tenure_months"]         = tgrp.cumcount() + 1
 
test = test.merge(
    customers[["customer_id", "territory", "subchannel", "customer_size",
               "latest_coolers", "latest_doors"]],
    on="customer_id", how="left"
)
for col in ["territory", "subchannel", "customer_size"]:
    test[col] = test[col].fillna("unknown")
    le = LabelEncoder()
    test[col + "_enc"] = le.fit_transform(test[col].astype(str))
 
X_submission = test[FEATURE_COLS].fillna(0)
test["churn_probability"] = model.predict_proba(X_submission)[:, 1]
 
submission = test[["customer_id", "calmonth", "churn_probability"]]
submission.to_csv(
    "/Users/doriandanielagonzalez/hack4her-2026/app/model/predictions.csv",
    index=False
)
print(f"  Saved predictions.csv — {len(submission):,} rows")
 
 
# ── 11. Save model ────────────────────────────────────────────────────────────
print(f"\nSaving model → {MODEL_OUT}")
joblib.dump({
    "model":        model,
    "explainer":    explainer,
    "feature_cols": FEATURE_COLS,
}, "/Users/doriandanielagonzalez/hack4her-2026/app/model/" + MODEL_OUT)
 
print("\nAll done!")
print("\nExample prediction:")
sample_input = X_test.iloc[0].to_dict()
 
input_df = pd.DataFrame([sample_input])[FEATURE_COLS]
proba    = model.predict_proba(input_df)[0][1]
sv       = explainer.shap_values(input_df)[0]
shap_ser = pd.Series(sv, index=FEATURE_COLS).sort_values(key=abs, ascending=False)
 
print({
    "churn_probability": round(float(proba), 4),
    "risk_level": "CRITICAL" if proba > 0.75 else "HIGH" if proba > 0.55 else "MEDIUM" if proba > 0.3 else "LOW",
    "top_reasons": [
        {"factor": f, "impact": "increases_churn" if v > 0 else "decreases_churn", "shap_value": round(float(v), 4)}
        for f, v in shap_ser.head(5).items()
    ]})