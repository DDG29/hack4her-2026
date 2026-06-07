from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client["hack4her"]
stores_collection = db["stores"]

# Your data
stores_data = [
    {
    "id": "0762995e",
    "full_id": "0762995eee3b0de578b35f9194acbb2af703c2cb7bef53a62f59dfc5",
    "name": "Abarrotes y bodegas · La Paz",
    "territory": "La Paz",
    "type": "Abarrotes y bodegas",
    "size": "Mini",
    "risk": "hi",
    "churnScore": 70,
    "avgBoxes": 0,
    "avgTransactions": 30,
    "monthsInactive": 95,
    "numCoolers": 0,
    "numDoors": 0,
    "lat": 24.0673,
    "lng": -110.1563
  },
  {
    "id": "0a01aa60",
    "full_id": "0a01aa607c38aa57dac236b74edeeda4e3e8b3d72d8f162526159138",
    "name": "Hogares · Matamoros",
    "territory": "Matamoros",
    "type": "Hogares",
    "size": "Mini",
    "risk": "hi",
    "churnScore": 70,
    "avgBoxes": 0,
    "avgTransactions": 2,
    "monthsInactive": 122,
    "numCoolers": 1,
    "numDoors": 1,
    "lat": 26.1395,
    "lng": -97.4659
  },
  {
    "id": "135397c8",
    "full_id": "135397c820067be03b1c22b7c5e0a08c884c842678c1838b647139b7",
    "name": "Hogares · Reynosa",
    "territory": "Reynosa",
    "type": "Hogares",
    "size": "Mini",
    "risk": "hi",
    "churnScore": 70,
    "avgBoxes": 0,
    "avgTransactions": 2,
    "monthsInactive": 123,
    "numCoolers": 0,
    "numDoors": 0,
    "lat": 26.2316,
    "lng": -98.1149
  },
  {
    "id": "1778aae4",
    "full_id": "1778aae41dd939e1bc57515921d9a4645868075e371b20975d0352e4",
    "name": "Licorería · Laredo",
    "territory": "Laredo",
    "type": "Licorería",
    "size": "Mini",
    "risk": "hi",
    "churnScore": 70,
    "avgBoxes": 0,
    "avgTransactions": 2,
    "monthsInactive": 60,
    "numCoolers": 0,
    "numDoors": 0,
    "lat": 27.5898,
    "lng": -99.484
  },
  {
    "id": "2126e6f3",
    "full_id": "2126e6f3493e6b58367415b53dd456fad593ec4316d8445e6c71fb68",
    "name": "Kiosco · Laredo",
    "territory": "Laredo",
    "type": "Kiosco",
    "size": "Mini",
    "risk": "hi",
    "churnScore": 70,
    "avgBoxes": 0,
    "avgTransactions": 2,
    "monthsInactive": 60,
    "numCoolers": 2,
    "numDoors": 3,
    "lat": 27.3242,
    "lng": -99.4667
  },
  {
    "id": "26cc5788",
    "full_id": "26cc57884ea644a63475a7b420d40c41d9aae96b8523386173af6e12",
    "name": "Proximidad · Monterrey",
    "territory": "Monterrey",
    "type": "Proximidad",
    "size": "Mini",
    "risk": "hi",
    "churnScore": 70,
    "avgBoxes": 0,
    "avgTransactions": 2,
    "monthsInactive": 60,
    "numCoolers": 1,
    "numDoors": 1,
    "lat": 25.4802,
    "lng": -100.3596
  },
  {
    "id": "2dd02978",
    "full_id": "2dd029786750cb3656762b450f3fd6d1b1d90d69fc11be529bb02e5d",
    "name": "Kiosco · Matamoros",
    "territory": "Matamoros",
    "type": "Kiosco",
    "size": "Mini",
    "risk": "hi",
    "churnScore": 70,
    "avgBoxes": 0,
    "avgTransactions": 2,
    "monthsInactive": 126,
    "numCoolers": 1,
    "numDoors": 1,
    "lat": 25.604,
    "lng": -97.7874
  },
  {
    "id": "3d6e19ee",
    "full_id": "3d6e19ee73fc41ad488188ee241c93f971eab943b43033ef3f06f07e",
    "name": "Kiosco · Saltillo",
    "territory": "Saltillo",
    "type": "Kiosco",
    "size": "Mini",
    "risk": "hi",
    "churnScore": 70,
    "avgBoxes": 0,
    "avgTransactions": 2,
    "monthsInactive": 60,
    "numCoolers": 1,
    "numDoors": 2,
    "lat": 25.6464,
    "lng": -101.2383
  },
  {
    "id": "3f703593",
    "full_id": "3f7035938d7b1adb1dcbebe843fe290cde36f32bb653dda14dded3a9",
    "name": "Hogares · Laredo",
    "territory": "Laredo",
    "type": "Hogares",
    "size": "Mini",
    "risk": "hi",
    "churnScore": 70,
    "avgBoxes": 0,
    "avgTransactions": 2,
    "monthsInactive": 129,
    "numCoolers": 0,
    "numDoors": 0,
    "lat": 27.5913,
    "lng": -99.7614
  },
  {
    "id": "463c9647",
    "full_id": "463c9647923e0fc6acc10e8d9ee2952c048d8e3b2248c23b0f1f3591",
    "name": "Abarrotes y bodegas · Matamoros",
    "territory": "Matamoros",
    "type": "Abarrotes y bodegas",
    "size": "Mini",
    "risk": "hi",
    "churnScore": 70,
    "avgBoxes": 0,
    "avgTransactions": 2,
    "monthsInactive": 60,
    "numCoolers": 0,
    "numDoors": 0,
    "lat": 25.9939,
    "lng": -97.4209
  },
]

stores_collection.insert_many(stores_data)
print("✓ Data inserted!")