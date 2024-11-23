import requests
import json

api_key = ""  # Replace with your actual API key
url = "https://api.brianknows.org/api/v0/agent/transaction"
headers = {
    "Content-Type": "application/json",
    "x-brian-api-key": api_key
}
data = {
    "prompt": "whats my strk balance on starknet",
    "address": "0x0215AF1A59d8ba6D49e4cc965bE8BfCd6Cbd86E0AbE758B32a82BDB353B749dE"
}

response = requests.post(url, json=data, headers=headers)

print("Status Code:", response.status_code)
print("Response Body:", response.json())