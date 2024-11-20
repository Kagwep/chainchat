from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ConversationHandler, ContextTypes
from starknet_py.contract import Contract
from starknet_py.net.account.account import Account
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.net.models import StarknetChainId
from starknet_py.net.signer.stark_curve_signer import KeyPair
import hashlib
from starknet_py.net.client_models import ResourceBounds

# States for the conversation
REGISTER, CHECK_USERNAME, ADDRESS, USERNAME, CONFIRMATION = range(5)

# Store temporary user data
user_data_dict = {}

# Initialize Starknet client and contract
client = FullNodeClient(node_url="https://starknet-sepolia.public.blastapi.io")
account = Account(
    address="0x0215AF1A59d8ba6D49e4cc965bE8BfCd6Cbd86E0AbE758B32a82BDB353B749dE",
    client=client,
    key_pair=KeyPair.from_private_key(""),
    chain=StarknetChainId.SEPOLIA
)

# Contract ABI
CONTRACT_ABI = [
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

contract = Contract(
    address="0x04482d8717b0fa8b9843514af3fb7eca5bbba36392d3559edc1ea8410d5b8329",
    abi=CONTRACT_ABI,
    provider=account,
    cairo_version=1
)

def validate_username(username: str) -> bool:
    if not username.startswith('@'):
        return False
    username_without_at = username[1:]
    if not (5 <= len(username_without_at) <= 32):
        return False
    allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_")
    return all(char in allowed_chars for char in username_without_at)

# Command: /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Welcome to the Starknet Username Registration Bot! 👋\n\n"
        "This bot helps you register your Telegram username on Starknet.\n"
        "Use /register to start the registration process.\n"
        "Use /help to see all available commands."
    )

# Command: /help
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = """
Available Commands:
/start - Start the bot
/help - Show this help message
/register - Start username registration process
/checkusername - Check what address a username is registered to
/cancel - Cancel the current operation
    """
    await update.message.reply_text(help_text)

# Command: /register
async def register(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user_id = update.effective_user.id
    
    if not update.effective_user.username:
        await update.message.reply_text(
            "You need to set a Telegram username before registering. "
            "Please set a username in your Telegram settings and try again."
        )
        return ConversationHandler.END
    
    user_data_dict[user_id] = {}
    
    await update.message.reply_text(
        "Please provide your Starknet wallet address:"
    )
    return ADDRESS

async def handle_address(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user_id = update.effective_user.id
    address = update.message.text.strip()
    
    if not address.startswith("0x") or len(address) != 66:
        await update.message.reply_text(
            "Invalid Starknet address format. Please provide a valid address "
            "starting with '0x' followed by 64 hexadecimal characters:"
        )
        return ADDRESS
    
    try:
        int(address, 16)
    except ValueError:
        await update.message.reply_text(
            "Invalid address format. Please provide a valid hexadecimal address:"
        )
        return ADDRESS
    
    user_data_dict[user_id]["address"] = address
    
    await update.message.reply_text(
        "Please provide your Telegram username (including the @ symbol):"
    )
    return USERNAME

async def handle_username(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user_id = update.effective_user.id
    provided_username = update.message.text.strip()
    actual_username = update.effective_user.username
    if actual_username:
        actual_username = f"@{actual_username}"
    
    if not validate_username(provided_username):
        await update.message.reply_text(
            "Invalid username format. Username must:\n"
            "- Start with @\n"
            "- Be 5-32 characters long\n"
            "- Contain only letters, numbers, and underscores\n"
            "Please try again:"
        )
        return USERNAME
    
    if not actual_username or provided_username != actual_username:
        await update.message.reply_text(
            f"The username you provided ({provided_username}) doesn't match "
            f"your Telegram username ({actual_username or 'not set'}). "
            "Please provide your actual Telegram username."
        )
        return USERNAME

    # Check availability with new hash function
    try:
        username_hash = get_username_hash(provided_username)
        (is_taken,) = await contract.functions["is_username_taken"].call(username_hash)
        
        if is_taken:
            await update.message.reply_text(
                "This username is already registered. Please contact support if you believe this is an error."
            )
            return USERNAME
    except Exception as e:
        await update.message.reply_text(f"Error checking username: {str(e)}")
        return USERNAME

    user_data_dict[user_id]["username"] = provided_username
    await update.message.reply_text(
        f"Please confirm your registration details:\n"
        f"Address: {user_data_dict[user_id]['address']}\n"
        f"Username: {provided_username}\n\n"
        f"Reply with 'confirm' to proceed or 'cancel' to abort."
    )
    return CONFIRMATION

async def handle_confirmation(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user_id = update.effective_user.id
    response = update.message.text.lower()

    if response == "confirm":
        try:
            # Final availability check with new hash function
            username = user_data_dict[user_id]["username"]
            username_hash = get_username_hash(username)
            (is_taken,) = await contract.functions["is_username_taken"].call(username_hash)
            
            if is_taken:
                await update.message.reply_text(
                    "Sorry, this username was just registered by someone else. Please try again."
                )
                return ConversationHandler.END

            # Register on Starknet
            user_address_int = int(user_data_dict[user_id]["address"], 16)
            
            # Prepare the invocation with explicit gas parameters
            prepared_call = contract.functions["register_username"].prepare_invoke_v1(
                username_hash,
                user_address_int,
                max_fee=int(1e16),

            )
            
            # # Estimate fee first
            # estimated_fee = await prepared_call.estimate_fee()
            # print(f"Estimated fee: {estimated_fee}")  # For debugging
            
            # Execute the transaction with the estimated fee
            invocation = await prepared_call.invoke()
            # Wait for transaction

            await update.message.reply_text(
                f"Transaction submitted! Hash: {invocation.transaction_hash}\n"
                "Waiting for confirmation..."
            )
            
            # Wait for transaction using client directly
            try:
                await account.client.wait_for_tx(invocation.transaction_hash)
                await update.message.reply_text(
                    f"Registration successful!\n"
                    f"Transaction hash: {invocation.transaction_hash}\n"
                    f"Your username has been registered on Starknet."
                )
            except Exception as wait_error:
                await update.message.reply_text(
                    f"Transaction was submitted (hash: {invocation.transaction_hash}) "
                    f"but there was an error waiting for confirmation: {str(wait_error)}\n"
                    "Please check the transaction status in your wallet or explorer."
                )

        except Exception as e:
            await update.message.reply_text(
                f"An error occurred during registration: {str(e)}"
            )
            print(f"Full error: {e}")  # For debugging
    else:
        await update.message.reply_text("Registration cancelled.")

    del user_data_dict[user_id]
    return ConversationHandler.END

def get_username_hash(username: str) -> int:
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

# Command: /checkusername
async def check_username(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text(
        "Please send the username to check (including @ symbol):"
    )
    return CHECK_USERNAME

async def check_username_result(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    username = update.message.text.strip()
    
    if not validate_username(username):
        await update.message.reply_text(
            "Invalid username format. Username must:\n"
            "- Start with @\n"
            "- Be 5-32 characters long\n"
            "- Contain only letters, numbers, and underscores"
        )
        return ConversationHandler.END
    
    try:
        # Use new hash function
        username_hash = get_username_hash(username)
        (user_address,) = await contract.functions["get_user_address_by_username"].call(
            username_hash
        )
  
        if user_address == 0:
            await update.message.reply_text(
                f"Username {username} is not registered"
            )
        else:
            address_hex = hex(user_address)
            await update.message.reply_text(
                f"Username {username} is registered to address:\n"
                f"{address_hex}"
            )
    except Exception as e:
        await update.message.reply_text(
            f"Error checking username: {str(e)}"
        )
    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel and end any ongoing conversation."""
    user_id = update.effective_user.id
    
    # Clean up any stored data
    if user_id in user_data_dict:
        del user_data_dict[user_id]
    
    # Clear any conversation data in context
    context.user_data.clear()
    context.chat_data.clear()
    
    await update.message.reply_text(
        "Current operation cancelled.\n"
        "You can use /register to start registration or /checkusername to check a username."
    )
    return ConversationHandler.END

# Main function to set up the bot
def main():
    token = ""
    application = Application.builder().token(token).build()

    # Command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))

    # Registration conversation handler
    registration_handler = ConversationHandler(
        entry_points=[CommandHandler("register", register)],
        states={
            ADDRESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_address)],
            USERNAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_username)],
            CONFIRMATION: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_confirmation)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        name="registration",  # Add unique name
        persistent=False,
        allow_reentry=True
    )

    # Username check conversation handler
    check_username_handler = ConversationHandler(
        entry_points=[CommandHandler("checkusername", check_username)],
        states={
            CHECK_USERNAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, check_username_result)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        name="check_username",  # Add unique name
        persistent=False,
        allow_reentry=True
    )

    application.add_handler(registration_handler)
    application.add_handler(check_username_handler)
    application.add_handler(CommandHandler("cancel", cancel))

    # Run the bot
    application.run_polling(poll_interval=3)

if __name__ == "__main__":
    main()