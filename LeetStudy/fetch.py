import requests
import json
BASE_URL = 'http://localhost:3000/api'
payload = {
        'username': 'player1'
    }
response = requests.post('http://localhost:3000/api/games/create',data = json.dumps(payload))
print(response)