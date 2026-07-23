import zipfile, re, html

def clean(s):
    return html.unescape(s).replace('\r', ' ').replace('\n', '; ')

with zipfile.ZipFile('Backlog_UserStories_CertificationHub.xlsx', 'r') as z:
    for sheet_name in ['xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml']:
        with z.open(sheet_name) as f:
            content = f.read().decode('utf-8')
        rows = re.findall(r'<row[^>]*>(.*?)</row>', content, re.DOTALL)
        print('=== ' + sheet_name + ' ===')
        for row in rows:
            pattern = re.compile(r'<t[^>]*>(.*?)</t>', re.DOTALL)
            cells_raw = re.findall(r'<c [^>]*>(.*?)</c>', row, re.DOTALL)
            cells = []
            for cell in cells_raw:
                texts = pattern.findall(cell)
                cells.append(' '.join(clean(t) for t in texts))
            if any(c.strip() for c in cells):
                print(' | '.join(cells[:7]))
        print()
