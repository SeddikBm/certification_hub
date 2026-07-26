import pandas as pd
import sys

file_path = r"C:\Users\dell\Desktop\certificationHub\Backlog_UserStories_CertificationHub.xlsx"
df_dict = pd.read_excel(file_path, sheet_name=None)

for sheet_name, df in df_dict.items():
    print(f"=== SHEET: {sheet_name} ===")
    print(df.to_string(index=False))
    print("\n")
