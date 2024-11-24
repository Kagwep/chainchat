import requests
import json

def fetch_tokens_list(page=0, size=20):
    base_url = "https://starknet.api.avnu.fi/v1/starknet/tokens"
    params = {"page": str(page), "size": str(size)}
    headers = {"Accept": "application/json"}

    response = requests.get(base_url, params=params, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"HTTP error! status: {response.status_code}")
    
    return response.json()

def save_tokens_to_files(unruggable_filename="unruggable_tokens.json", other_filename="other_tokens.json"):
    page = 0
    size = 50  # Adjust the page size if needed
    all_unruggable_tokens = []
    all_other_tokens = []

    while True:
        try:
            print(f"Fetching page {page}...")
            data = fetch_tokens_list(page=page, size=size)

            # Separate tokens into two categories
            for token in data.get("content", []):
                if "Unruggable" in token.get("tags", []):
                    all_unruggable_tokens.append(token)
                else:
                    all_other_tokens.append(token)

            # Check if we've fetched all pages
            if page >= data.get("totalPages", 1) - 1:
                break

            page += 1
        except Exception as e:
            print(f"Error fetching tokens: {e}")
            break

    # Save Unruggable tokens to a JSON file
    with open(unruggable_filename, "w") as f:
        json.dump(all_unruggable_tokens, f, indent=4)
    print(f"Saved {len(all_unruggable_tokens)} unruggable tokens to {unruggable_filename}")

    # Save other tokens to a JSON file
    with open(other_filename, "w") as f:
        json.dump(all_other_tokens, f, indent=4)
    print(f"Saved {len(all_other_tokens)} other tokens to {other_filename}")

# Run the script
if __name__ == "__main__":
    save_tokens_to_files()
