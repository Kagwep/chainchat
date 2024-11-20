use starknet::ContractAddress;
use contracts::models::Route;

#[starknet::interface]
trait IChainChatFinance<TContractState> {
    fn token_name(self: @TContractState, contract_address: ContractAddress) -> ByteArray;
    fn transfer_token(
        ref self: TContractState, address: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn swap_multi_route(
        ref self: TContractState,
        token_from_address: ContractAddress,
        token_from_amount: u256,
        token_to_address: ContractAddress,
        token_to_amount: u256,
        token_to_min_amount: u256,
        beneficiary: ContractAddress,
        integrator_fee_amount_bps: u128,
        integrator_fee_recipient: ContractAddress,
        routes: Array<Route>,
    );
    
    fn register_username(ref self: TContractState, username_hash: felt252,user_address: ContractAddress);
    fn is_username_taken(self:@TContractState, username_hash: felt252) -> bool;
    fn get_user_address_by_username(self: @TContractState, username_hash:felt252) -> ContractAddress;

    
}

#[starknet::contract]
mod ChainChatFinance {
    use starknet::storage::StoragePointerReadAccess;
use starknet::storage::StoragePointerWriteAccess;
    use contracts::interfaces::IERC20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use contracts::interfaces::IERC20Metadata::{IERC20MetadataDispatcher, IERC20MetadataDispatcherTrait};
    use contracts::interfaces::IExchange::{IExchangeDispatcher,IExchangeDispatcherTrait};
    use super::IChainChatFinance;
    use core::starknet::{get_caller_address, ContractAddress, get_contract_address};
    use contracts::models::Route;
    use starknet::storage::{
         StoragePathEntry, Map
    };

    #[storage]
    struct Storage {
        exchange_address: ContractAddress,
        user_names: Map::<felt252, ContractAddress>,
        registered_username: Map::<ContractAddress, bool>,
    }


    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,

    ) {
        self.exchange_address.write(owner);
    }

    #[abi(embed_v0)]
    impl chainChatFinance of IChainChatFinance<ContractState> {
        fn token_name(self: @ContractState, contract_address: ContractAddress) -> ByteArray {
            IERC20MetadataDispatcher { contract_address }.name()
        }

        fn transfer_token(
            ref self: ContractState,
            address: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) -> bool {
            let erc20_dispatcher = IERC20Dispatcher { contract_address: address };
            erc20_dispatcher.transfer_from(get_caller_address(), recipient, amount)
        }
        fn swap_multi_route(
            ref self: ContractState,
            token_from_address: ContractAddress,
            token_from_amount: u256,
            token_to_address: ContractAddress,
            token_to_amount: u256,
            token_to_min_amount: u256,
            beneficiary: ContractAddress,
            integrator_fee_amount_bps: u128,
            integrator_fee_recipient: ContractAddress,
            routes: Array<Route>,
        ){

            let exchange_dispatcher = IExchangeDispatcher { contract_address: self.exchange_address.read() };
            exchange_dispatcher.multi_route_swap(
                token_from_address,
                token_from_amount,
                token_to_address,
                token_to_amount,
                token_to_min_amount,
                beneficiary,
                integrator_fee_amount_bps,
                integrator_fee_recipient,
                routes);
        }


        fn register_username(ref self: ContractState, username_hash: felt252, user_address: ContractAddress){
            let caller = get_caller_address();
            self.user_names.entry(username_hash).write(user_address);
            self.registered_username.entry(user_address).write(true);
        }

        fn is_username_taken(self:@ContractState, username_hash: felt252) -> bool {

            let user_address =  self.user_names.entry(username_hash).read();
            self.registered_username.entry(user_address).read()

        }

        fn get_user_address_by_username(self: @ContractState, username_hash:felt252) -> ContractAddress{
             self.user_names.entry(username_hash).read()
        }
    


    }
}