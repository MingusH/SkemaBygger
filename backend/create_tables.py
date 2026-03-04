from database import engine
import models
import sqlite3

print("Opretter database tabeller...")
print("Models importeret:", models)
print("Base metadata FØR import:", models.Base.metadata.tables.keys())

Base = models.Base
print("Base fra models:", Base)
print("Base metadata EFTER:", Base.metadata.tables.keys())

Base.metadata.create_all(bind=engine)
print("Tabeller oprettet!")

# Vis tabeller
conn = sqlite3.connect('skema.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tabeller i databasen:")
for table in tables:
    print(f"- {table[0]}")
conn.close()
