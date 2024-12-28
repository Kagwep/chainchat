import requests
import json

# Set the API URL and your API key
url = "https://api.brianknows.org/api/v0/agent/parameters-extraction"
api_key = ""  # Replace with your actual API key

# Prepare the data to send in the POST request
data = {
    "prompt": "bridge 100 usdt from arbitrum"
}

# Set the headers
headers = {
    "Content-Type": "application/json",
    "x-brian-api-key": api_key
}

# Make the POST request
response = requests.post(url, headers=headers, json=data)

# Check if the request was successful
if response.status_code == 200:
    # If successful, print the response JSON
    print("Response:", json.dumps(response.json(), indent=4))
else:
    # If something went wrong, print the error message
    print(f"Error: {response.status_code} - {response.text}")
