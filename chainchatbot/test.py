import hashlib


def get_username_hash(username: str) -> int:
    """
    Get a consistent and well-distributed hash for Starknet felt.
    This implementation ensures:
    1. Deterministic output
    2. Consistent across different runs
    3. Within valid felt range
    4. Well-distributed
    """
    # Constants
    FIELD_PRIME = 2**251 + 17 * 2**192 + 1
    
    # Remove @ and convert to lowercase to ensure consistency
    username_clean = username[1:] if username.startswith('@') else username
    username_clean = username_clean.lower()
    
    # Use Pedersen hash or other more Starknet-native hashing
    # For now, we'll use a combination of SHA-256 truncated appropriately
    hash_bytes = hashlib.sha256(username_clean.encode()).digest()
    # Take first 31 bytes to ensure we're under 2^251
    truncated_bytes = hash_bytes[:31]
    # Add a zero byte at the start to ensure we're under the field prime
    padded_bytes = b'\x00' + truncated_bytes
    
    # Convert to integer
    hash_int = int.from_bytes(padded_bytes, byteorder='big')
    
    # Double-check we're in range (should always be true with above logic)
    assert hash_int < FIELD_PRIME, "Hash unexpectedly large"
    
    return hash_int

# Example usage and test
def test_hash_properties():
    test_cases = [
        "@User1",
        "@user1",  # Should produce same hash as above after normalization
        "@User2",
        "@reallylong_username_123",
        "@short_1"
    ]
    
    results = {}
    for username in test_cases:
        # Test consistency
        hash1 = get_username_hash(username)
        hash2 = get_username_hash(username)
        
        results[username] = {
            "hash": hash1,
            "consistent": hash1 == hash2,
            "in_range": hash1 < (2**251 + 17 * 2**192 + 1)
        }
    
    return results


 
 # Test username
username = "@testser123"

# First run (like first bot session)
hash1 = get_username_hash(username)
print(f"First session hash: {hash1}")

# Exit and restart (simulating bot restart)
hash2 = get_username_hash(username)
print(f"Second session hash: {hash2}")

print(f"Hashes match: {hash1 == hash2}")
test_hash_properties()