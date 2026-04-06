import sqlite3

conn = sqlite3.connect('hiring_intelligence.db')
cursor = conn.cursor()

queries = [
    'SELECT * FROM users LIMIT 1',
    'SELECT * FROM resumes LIMIT 1',
    'SELECT * FROM applications LIMIT 1',
    'SELECT * FROM jobs LIMIT 1',
    'SELECT * FROM interviews LIMIT 1'
]

for q in queries:
    print(f'Query: {q}')
    try:
        cursor.execute(q)
        print('SUCCESS')
    except Exception as e:
        print(f'ERROR: {e}')
