import requests

# Replace with your actual API key
api_key = ""  
url = "https://api.brianknows.org/api/v0/agent/parameters-extraction"

headers = {
    "Content-Type": "application/json",
    "x-brian-api-key": api_key
}

# Define the prompt
prompt = "Deploy a erc20 named 'Unruggable' with the symbol 'MEME' and an initial supply of 10,000."


# Define the request payload
payload = {
    "prompt": prompt
}

try:
    # Send a POST request
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()  # Raise an error for HTTP errors
    
    # Fetch the response JSON
    response_data = response.json()
    print("Response data:", response_data)
    
except requests.exceptions.RequestException as e:
    print("Error extracting parameters:", e)
