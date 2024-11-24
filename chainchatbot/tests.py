import requests

def get_token_pools(network, token_address):
    url = f"https://api.geckoterminal.com/api/v2/networks/{network}/tokens/{token_address}/pools"
    
    headers = {
        "Accept": "application/json;version=20230302"
    }
    
    response = requests.get(url, headers=headers)
    return response.json()

# Example usage
network = "starknet-alpha"
token_address = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"

result = get_token_pools(network, token_address)
print(result)