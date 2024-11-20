import requests

# Base URL
base_url = "http://localhost:8000"

# Check username
response = requests.get(f"{base_url}/check-username/@Kagwep")
print(response.json())

# Validate username
response = requests.get(f"{base_url}/validate-username/@Kagwep")
print(response.json())

# Health check
response = requests.get(f"{base_url}/health")
print(response.json())