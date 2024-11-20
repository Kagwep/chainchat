from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from starknet_py.contract import Contract
from starknet_py.net.account.account import Account
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.net.models import StarknetChainId
from starknet_py.net.signer.stark_curve_signer import KeyPair
import hashlib

class StarknetAPI:
    def __init__(
        self, 
        contract_address: str,
        account_address: str,
        private_key: str,
        node_url: str
    ):
        # Initialize Starknet client
        self.client = FullNodeClient(node_url=node_url)
        
        # Initialize account
        self.account = Account(
            address=account_address,
            client=self.client,
            key_pair=KeyPair.from_private_key(private_key),
            chain=StarknetChainId.SEPOLIA
        )
        
        # Contract ABI
        self.abi = [
    {
      "name": "chainChatFinance",
      "type": "impl",
      "interface_name": "contracts::chainchat::IChainChatFinance"
    },
    {
      "name": "core::byte_array::ByteArray",
      "type": "struct",
      "members": [
        {
          "name": "data",
          "type": "core::array::Array::<core::bytes_31::bytes31>"
        },
        {
          "name": "pending_word",
          "type": "core::felt252"
        },
        {
          "name": "pending_word_len",
          "type": "core::integer::u32"
        }
      ]
    },
    {
      "name": "core::integer::u256",
      "type": "struct",
      "members": [
        {
          "name": "low",
          "type": "core::integer::u128"
        },
        {
          "name": "high",
          "type": "core::integer::u128"
        }
      ]
    },
    {
      "name": "core::bool",
      "type": "enum",
      "variants": [
        {
          "name": "False",
          "type": "()"
        },
        {
          "name": "True",
          "type": "()"
        }
      ]
    },
    {
      "name": "contracts::models::Route",
      "type": "struct",
      "members": [
        {
          "name": "token_from",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "token_to",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "exchange_address",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "percent",
          "type": "core::integer::u128"
        },
        {
          "name": "additional_swap_params",
          "type": "core::array::Array::<core::felt252>"
        }
      ]
    },
    {
      "name": "contracts::chainchat::IChainChatFinance",
      "type": "interface",
      "items": [
        {
          "name": "token_name",
          "type": "function",
          "inputs": [
            {
              "name": "contract_address",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::byte_array::ByteArray"
            }
          ],
          "state_mutability": "view"
        },
        {
          "name": "transfer_token",
          "type": "function",
          "inputs": [
            {
              "name": "address",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "recipient",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "amount",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "external"
        },
        {
          "name": "swap_multi_route",
          "type": "function",
          "inputs": [
            {
              "name": "token_from_address",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "token_from_amount",
              "type": "core::integer::u256"
            },
            {
              "name": "token_to_address",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "token_to_amount",
              "type": "core::integer::u256"
            },
            {
              "name": "token_to_min_amount",
              "type": "core::integer::u256"
            },
            {
              "name": "beneficiary",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "integrator_fee_amount_bps",
              "type": "core::integer::u128"
            },
            {
              "name": "integrator_fee_recipient",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "routes",
              "type": "core::array::Array::<contracts::models::Route>"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "name": "register_username",
          "type": "function",
          "inputs": [
            {
              "name": "username_hash",
              "type": "core::felt252"
            },
            {
              "name": "user_address",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "name": "is_username_taken",
          "type": "function",
          "inputs": [
            {
              "name": "username_hash",
              "type": "core::felt252"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "view"
        },
        {
          "name": "get_user_address_by_username",
          "type": "function",
          "inputs": [
            {
              "name": "username_hash",
              "type": "core::felt252"
            }
          ],
          "outputs": [
            {
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "state_mutability": "view"
        }
      ]
    },
    {
      "name": "constructor",
      "type": "constructor",
      "inputs": [
        {
          "name": "owner",
          "type": "core::starknet::contract_address::ContractAddress"
        }
      ]
    },
    {
      "kind": "enum",
      "name": "contracts::chainchat::ChainChatFinance::Event",
      "type": "event",
      "variants": []
    }
  ]
        
        # Initialize contract
        self.contract = Contract(
            address=contract_address,
            abi=self.abi,
            provider=self.account,
            cairo_version=1
        )

    def validate_username(self, username: str) -> bool:
        if not username.startswith('@'):
            return False
        username_without_at = username[1:]
        if not (5 <= len(username_without_at) <= 32):
            return False
        allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_")
        return all(char in allowed_chars for char in username_without_at)

    def get_username_hash(self, username: str) -> int:
        """
        Get a valid Starknet felt hash for a username.
        The felt range in Cairo is [0, P) where P = 2**251 + 17 * 2**192 + 1
        """
        FIELD_PRIME = 2**251 + 17 * 2**192 + 1
        
        # Remove @ and normalize
        username_clean = username[1:] if username.startswith('@') else username
        username_clean = username_clean.lower()
        
        # Get the hash within valid range
        hash_bytes = hashlib.sha256(username_clean.encode()).digest()
        hash_int = int.from_bytes(hash_bytes, byteorder='big')
        felt_hash = hash_int % FIELD_PRIME
        
        return felt_hash

    async def check_username(self, username: str):
        """Check if a username is registered and get its address."""
        if not self.validate_username(username):
            raise HTTPException(status_code=400, detail="Invalid username format")
        
        try:
            username_hash = self.get_username_hash(username)
            (user_address,) = await self.contract.functions["get_user_address_by_username"].call(
                username_hash
            )
            
            if user_address == 0:
                raise HTTPException(status_code=404, detail="Username not registered")
                
            return {
                "username": username,
                "address": hex(user_address)
            }
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=str(e))

def create_app(starknet_api: StarknetAPI):
    app = FastAPI(title="Starknet Username API")
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy"}

    @app.get("/check-username/{username}")
    async def check_username_endpoint(username: str):
        """Check if a username is registered and get its address."""
        return await starknet_api.check_username(username)

    @app.get("/validate-username/{username}")
    async def validate_username_endpoint(username: str):
        """Validate username format."""
        is_valid = starknet_api.validate_username(username)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid username format")
        return {"username": username, "valid": True}

    return app

def start_api():
    # Configuration
    CONTRACT_ADDRESS = "0x04482d8717b0fa8b9843514af3fb7eca5bbba36392d3559edc1ea8410d5b8329"
    ACCOUNT_ADDRESS = "0x0215AF1A59d8ba6D49e4cc965bE8BfCd6Cbd86E0AbE758B32a82BDB353B749dE"
    PRIVATE_KEY = ""
    NODE_URL = "https://starknet-sepolia.public.blastapi.io"
    
    # Initialize API
    starknet_api = StarknetAPI(
        contract_address=CONTRACT_ADDRESS,
        account_address=ACCOUNT_ADDRESS,
        private_key=PRIVATE_KEY,
        node_url=NODE_URL
    )
    
    # Create FastAPI app
    app = create_app(starknet_api)
    
    # Run the API
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    start_api()