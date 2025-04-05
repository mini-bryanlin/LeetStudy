import requests
import json

url = "http://localhost:3000/api/games/start"
data = {
    "topic": "hello",
    "difficulty": "easy",
    "username": "one"
}

# Send the request as JSON
response = requests.post(url, json=data)  # Use the 'json' parameter to send JSON data
print(response.json())