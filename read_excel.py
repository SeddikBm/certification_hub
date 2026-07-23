import pandas as pd
df = pd.read_excel('Backlog_UserStories_CertificationHub.xlsx')
with open('excel_dump.txt', 'w', encoding='utf-8') as f:
    f.write(df.to_string())
