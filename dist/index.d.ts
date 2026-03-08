/// <reference types="node" resolution-mode="require"/>
export { AgentAccountV2Abi, AgentAccountFactoryV2Abi } from './abi.js';
export { X402Client, X402BudgetTracker, X402PaymentError, X402BudgetExceededError, createX402Client, createX402Fetch, wrapWithX402, USDC_ADDRESSES, DEFAULT_SUPPORTED_NETWORKS, } from './x402/index.js';
/** Native ETH token address (zero address) */
export declare const NATIVE_TOKEN: "0x0000000000000000000000000000000000000000";
/**
 * Create a wallet client connected to an existing AgentAccountV2.
 */
export declare function createWallet(config: any): {
    address: any;
    contract: {
        read: {
            [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<({
                name: string;
                type: string;
                stateMutability: string;
                inputs: {
                    name: string;
                    type: string;
                }[];
                outputs: {
                    name: string;
                    type: string;
                }[];
            } | {
                name: string;
                type: string;
                inputs: {
                    name: string;
                    type: string;
                    indexed: boolean;
                }[];
                stateMutability?: undefined;
                outputs?: undefined;
            })[], string, readonly unknown[]>, "address" | "args" | "abi" | "functionName">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<({
                name: string;
                type: string;
                stateMutability: string;
                inputs: {
                    name: string;
                    type: string;
                }[];
                outputs: {
                    name: string;
                    type: string;
                }[];
            } | {
                name: string;
                type: string;
                inputs: {
                    name: string;
                    type: string;
                    indexed: boolean;
                }[];
                stateMutability?: undefined;
                outputs?: undefined;
            })[], string, readonly unknown[]>, "address" | "args" | "abi" | "functionName">> | undefined]) => Promise<unknown>;
        };
        estimateGas: {
            [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<({
                name: string;
                type: string;
                stateMutability: string;
                inputs: {
                    name: string;
                    type: string;
                }[];
                outputs: {
                    name: string;
                    type: string;
                }[];
            } | {
                name: string;
                type: string;
                inputs: {
                    name: string;
                    type: string;
                    indexed: boolean;
                }[];
                stateMutability?: undefined;
                outputs?: undefined;
            })[], string, readonly unknown[], any>, "address" | "args" | "abi" | "functionName">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<({
                name: string;
                type: string;
                stateMutability: string;
                inputs: {
                    name: string;
                    type: string;
                }[];
                outputs: {
                    name: string;
                    type: string;
                }[];
            } | {
                name: string;
                type: string;
                inputs: {
                    name: string;
                    type: string;
                    indexed: boolean;
                }[];
                stateMutability?: undefined;
                outputs?: undefined;
            })[], string, readonly unknown[], any>, "address" | "args" | "abi" | "functionName">>]) => Promise<bigint>;
        };
        simulate: {
            [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends `0x${string}` | import("viem").Account | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<({
                name: string;
                type: string;
                stateMutability: string;
                inputs: {
                    name: string;
                    type: string;
                }[];
                outputs: {
                    name: string;
                    type: string;
                }[];
            } | {
                name: string;
                type: string;
                inputs: {
                    name: string;
                    type: string;
                    indexed: boolean;
                }[];
                stateMutability?: undefined;
                outputs?: undefined;
            })[], string, readonly unknown[], any, chainOverride, accountOverride>, "address" | "args" | "abi" | "functionName"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<({
                name: string;
                type: string;
                stateMutability: string;
                inputs: {
                    name: string;
                    type: string;
                }[];
                outputs: {
                    name: string;
                    type: string;
                }[];
            } | {
                name: string;
                type: string;
                inputs: {
                    name: string;
                    type: string;
                    indexed: boolean;
                }[];
                stateMutability?: undefined;
                outputs?: undefined;
            })[], string, readonly unknown[], any, chainOverride, accountOverride>, "address" | "args" | "abi" | "functionName"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
        };
        createEventFilter: {
            [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                strict?: undefined;
                toBlock?: undefined;
                args?: undefined;
            }, options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
        };
        getEvents: {
            [x: string]: (...parameters: [options?: {
                blockHash?: `0x${string}` | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined] | [args?: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            } | undefined, options?: {
                blockHash?: `0x${string}` | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined]) => Promise<import("viem").GetContractEventsReturnType<({
                name: string;
                type: string;
                stateMutability: string;
                inputs: {
                    name: string;
                    type: string;
                }[];
                outputs: {
                    name: string;
                    type: string;
                }[];
            } | {
                name: string;
                type: string;
                inputs: {
                    name: string;
                    type: string;
                    indexed: boolean;
                }[];
                stateMutability?: undefined;
                outputs?: undefined;
            })[], string>>;
        };
        watchEvent: {
            [x: string]: (...parameters: [options?: {
                batch?: boolean | undefined;
                pollingInterval?: number | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<({
                    name: string;
                    type: string;
                    stateMutability: string;
                    inputs: {
                        name: string;
                        type: string;
                    }[];
                    outputs: {
                        name: string;
                        type: string;
                    }[];
                } | {
                    name: string;
                    type: string;
                    inputs: {
                        name: string;
                        type: string;
                        indexed: boolean;
                    }[];
                    stateMutability?: undefined;
                    outputs?: undefined;
                })[], string, undefined>;
                poll?: true | undefined;
            } | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            }, options?: {
                batch?: boolean | undefined;
                pollingInterval?: number | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<({
                    name: string;
                    type: string;
                    stateMutability: string;
                    inputs: {
                        name: string;
                        type: string;
                    }[];
                    outputs: {
                        name: string;
                        type: string;
                    }[];
                } | {
                    name: string;
                    type: string;
                    inputs: {
                        name: string;
                        type: string;
                        indexed: boolean;
                    }[];
                    stateMutability?: undefined;
                    outputs?: undefined;
                })[], string, undefined>;
                poll?: true | undefined;
            } | undefined]) => import("viem").WatchContractEventReturnType;
        };
        address: any;
        abi: ({
            name: string;
            type: string;
            stateMutability: string;
            inputs: {
                name: string;
                type: string;
            }[];
            outputs: {
                name: string;
                type: string;
            }[];
        } | {
            name: string;
            type: string;
            inputs: {
                name: string;
                type: string;
                indexed: boolean;
            }[];
            stateMutability?: undefined;
            outputs?: undefined;
        })[];
    };
    publicClient: {
        account: undefined;
        batch?: {
            multicall?: boolean | {
                batchSize?: number | undefined;
                deployless?: boolean | undefined;
                wait?: number | undefined;
            } | undefined;
        } | undefined;
        cacheTime: number;
        ccipRead?: false | {
            request?: ((parameters: import("viem").CcipRequestParameters) => Promise<`0x${string}`>) | undefined;
        } | undefined;
        chain: any;
        dataSuffix?: import("viem").DataSuffix | undefined;
        experimental_blockTag?: import("viem").BlockTag | undefined;
        key: string;
        name: string;
        pollingInterval: number;
        request: import("viem").EIP1193RequestFn<import("viem").PublicRpcSchema>;
        transport: import("viem").TransportConfig<"http", import("viem").EIP1193RequestFn> & {
            fetchOptions?: Omit<RequestInit, "body"> | undefined;
            url?: string | undefined;
        };
        type: string;
        uid: string;
        call: (parameters: import("viem").CallParameters<any>) => Promise<import("viem").CallReturnType>;
        createAccessList: (parameters: import("viem").CreateAccessListParameters<any>) => Promise<{
            accessList: import("viem").AccessList;
            gasUsed: bigint;
        }>;
        createBlockFilter: () => Promise<{
            id: `0x${string}`;
            request: import("viem").EIP1193RequestFn<readonly [{
                Method: "eth_getFilterChanges";
                Parameters: [filterId: `0x${string}`];
                ReturnType: `0x${string}`[] | import("viem").RpcLog[];
            }, {
                Method: "eth_getFilterLogs";
                Parameters: [filterId: `0x${string}`];
                ReturnType: import("viem").RpcLog[];
            }, {
                Method: "eth_uninstallFilter";
                Parameters: [filterId: `0x${string}`];
                ReturnType: boolean;
            }]>;
            type: "block";
        }>;
        createContractEventFilter: <const abi extends import("viem").Abi | readonly unknown[], eventName extends import("viem").ContractEventName<abi> | undefined, args extends import("viem").MaybeExtractEventArgsFromAbi<abi, eventName> | undefined, strict_1 extends boolean | undefined = undefined, fromBlock extends bigint | import("viem").BlockTag | undefined = undefined, toBlock extends bigint | import("viem").BlockTag | undefined = undefined>(args: import("viem").CreateContractEventFilterParameters<abi, eventName, args, strict_1, fromBlock, toBlock>) => Promise<import("viem").CreateContractEventFilterReturnType<abi, eventName, args, strict_1, fromBlock, toBlock>>;
        createEventFilter: <const abiEvent extends import("viem").AbiEvent | undefined = undefined, const abiEvents extends readonly unknown[] | readonly import("viem").AbiEvent[] | undefined = abiEvent extends import("viem").AbiEvent ? [abiEvent] : undefined, strict_2 extends boolean | undefined = undefined, fromBlock_1 extends bigint | import("viem").BlockTag | undefined = undefined, toBlock_1 extends bigint | import("viem").BlockTag | undefined = undefined, _EventName extends string | undefined = import("viem").MaybeAbiEventName<abiEvent>, _Args extends import("viem").MaybeExtractEventArgsFromAbi<abiEvents, _EventName> | undefined = undefined>(args?: import("viem").CreateEventFilterParameters<abiEvent, abiEvents, strict_2, fromBlock_1, toBlock_1, _EventName, _Args> | undefined) => Promise<import("viem").Filter<"event", abiEvents, _EventName, _Args, strict_2, fromBlock_1, toBlock_1> extends infer T ? { [K in keyof T]: import("viem").Filter<"event", abiEvents, _EventName, _Args, strict_2, fromBlock_1, toBlock_1>[K]; } : never>;
        createPendingTransactionFilter: () => Promise<{
            id: `0x${string}`;
            request: import("viem").EIP1193RequestFn<readonly [{
                Method: "eth_getFilterChanges";
                Parameters: [filterId: `0x${string}`];
                ReturnType: `0x${string}`[] | import("viem").RpcLog[];
            }, {
                Method: "eth_getFilterLogs";
                Parameters: [filterId: `0x${string}`];
                ReturnType: import("viem").RpcLog[];
            }, {
                Method: "eth_uninstallFilter";
                Parameters: [filterId: `0x${string}`];
                ReturnType: boolean;
            }]>;
            type: "transaction";
        }>;
        estimateContractGas: <chain extends import("viem").Chain | undefined, const abi_1 extends import("viem").Abi | readonly unknown[], functionName extends import("viem").ContractFunctionName<abi_1, "nonpayable" | "payable">, args_1 extends import("viem").ContractFunctionArgs<abi_1, "nonpayable" | "payable", functionName>>(args: import("viem").EstimateContractGasParameters<abi_1, functionName, args, chain>) => Promise<bigint>;
        estimateGas: (args: import("viem").EstimateGasParameters<any>) => Promise<bigint>;
        fillTransaction: <chainOverride_1 extends import("viem").Chain | undefined = undefined, accountOverride_1 extends `0x${string}` | import("viem").Account | undefined = undefined>(args: import("viem").FillTransactionParameters<any, import("viem").Account | undefined, chainOverride_1, accountOverride_1>) => Promise<import("viem").FillTransactionReturnType<any, chainOverride_1>>;
        getBalance: (args: import("viem").GetBalanceParameters) => Promise<bigint>;
        getBlobBaseFee: () => Promise<bigint>;
        getBlock: <includeTransactions extends boolean = false, blockTag extends import("viem").BlockTag = "latest">(args?: import("viem").GetBlockParameters<includeTransactions, blockTag> | undefined) => Promise<{
            [x: string]: any;
            [x: number]: any;
            [x: symbol]: any;
            transactions: includeTransactions extends true ? {
                [x: string]: any;
                [x: number]: any;
                [x: symbol]: any;
                blockHash: (blockTag extends "pending" ? true : false) extends infer T_1 ? T_1 extends (blockTag extends "pending" ? true : false) ? T_1 extends true ? null : `0x${string}` : never : never;
                blockNumber: (blockTag extends "pending" ? true : false) extends infer T_2 ? T_2 extends (blockTag extends "pending" ? true : false) ? T_2 extends true ? null : bigint : never : never;
                transactionIndex: (blockTag extends "pending" ? true : false) extends infer T_3 ? T_3 extends (blockTag extends "pending" ? true : false) ? T_3 extends true ? null : number : never : never;
            }[] : `0x${string}`[];
        }>;
        getBlockNumber: (args?: import("viem").GetBlockNumberParameters | undefined) => Promise<bigint>;
        getBlockTransactionCount: (args?: import("viem").GetBlockTransactionCountParameters | undefined) => Promise<number>;
        getBytecode: (args: import("viem").GetBytecodeParameters) => Promise<import("viem").GetBytecodeReturnType>;
        getChainId: () => Promise<number>;
        getCode: (args: import("viem").GetBytecodeParameters) => Promise<import("viem").GetBytecodeReturnType>;
        getContractEvents: <const abi_2 extends import("viem").Abi | readonly unknown[], eventName_1 extends import("viem").ContractEventName<abi_2> | undefined = undefined, strict_3 extends boolean | undefined = undefined, fromBlock_2 extends bigint | import("viem").BlockTag | undefined = undefined, toBlock_2 extends bigint | import("viem").BlockTag | undefined = undefined>(args: import("viem").GetContractEventsParameters<abi_2, eventName_1, strict_3, fromBlock_2, toBlock_2>) => Promise<import("viem").GetContractEventsReturnType<abi_2, eventName_1, strict_3, fromBlock_2, toBlock_2>>;
        getEip712Domain: (args: import("viem").GetEip712DomainParameters) => Promise<import("viem").GetEip712DomainReturnType>;
        getEnsAddress: (args: {
            blockNumber?: bigint | undefined;
            blockTag?: import("viem").BlockTag | undefined;
            coinType?: bigint | undefined;
            gatewayUrls?: string[] | undefined;
            name: string;
            strict?: boolean | undefined;
            universalResolverAddress?: `0x${string}` | undefined;
        }) => Promise<import("viem").GetEnsAddressReturnType>;
        getEnsAvatar: (args: {
            name: string;
            blockNumber?: bigint | undefined;
            blockTag?: import("viem").BlockTag | undefined;
            gatewayUrls?: string[] | undefined;
            strict?: boolean | undefined;
            universalResolverAddress?: `0x${string}` | undefined;
            assetGatewayUrls?: import("viem").AssetGatewayUrls | undefined;
        }) => Promise<import("viem").GetEnsAvatarReturnType>;
        getEnsName: (args: {
            blockNumber?: bigint | undefined;
            blockTag?: import("viem").BlockTag | undefined;
            address: `0x${string}`;
            coinType?: bigint | undefined;
            gatewayUrls?: string[] | undefined;
            strict?: boolean | undefined;
            universalResolverAddress?: `0x${string}` | undefined;
        }) => Promise<import("viem").GetEnsNameReturnType>;
        getEnsResolver: (args: {
            blockNumber?: bigint | undefined;
            blockTag?: import("viem").BlockTag | undefined;
            name: string;
            universalResolverAddress?: `0x${string}` | undefined;
        }) => Promise<`0x${string}`>;
        getEnsText: (args: {
            blockNumber?: bigint | undefined;
            blockTag?: import("viem").BlockTag | undefined;
            name: string;
            gatewayUrls?: string[] | undefined;
            key: string;
            strict?: boolean | undefined;
            universalResolverAddress?: `0x${string}` | undefined;
        }) => Promise<import("viem").GetEnsTextReturnType>;
        getFeeHistory: (args: import("viem").GetFeeHistoryParameters) => Promise<import("viem").GetFeeHistoryReturnType>;
        estimateFeesPerGas: <chainOverride_2 extends import("viem").Chain | undefined = undefined, type extends import("viem").FeeValuesType = "eip1559">(args?: import("viem").EstimateFeesPerGasParameters<any, chainOverride_2, type> | undefined) => Promise<import("viem").EstimateFeesPerGasReturnType<type>>;
        getFilterChanges: <filterType extends import("viem").FilterType, const abi_3 extends import("viem").Abi | readonly unknown[] | undefined, eventName_2 extends string | undefined, strict_4 extends boolean | undefined = undefined, fromBlock_3 extends bigint | import("viem").BlockTag | undefined = undefined, toBlock_3 extends bigint | import("viem").BlockTag | undefined = undefined>(args: import("viem").GetFilterChangesParameters<filterType, abi_3, eventName_2, strict_4, fromBlock_3, toBlock_3>) => Promise<import("viem").GetFilterChangesReturnType<filterType, abi_3, eventName_2, strict_4, fromBlock_3, toBlock_3>>;
        getFilterLogs: <const abi_4 extends import("viem").Abi | readonly unknown[] | undefined, eventName_3 extends string | undefined, strict_5 extends boolean | undefined = undefined, fromBlock_4 extends bigint | import("viem").BlockTag | undefined = undefined, toBlock_4 extends bigint | import("viem").BlockTag | undefined = undefined>(args: import("viem").GetFilterLogsParameters<abi_4, eventName_3, strict_5, fromBlock_4, toBlock_4>) => Promise<import("viem").GetFilterLogsReturnType<abi_4, eventName_3, strict_5, fromBlock_4, toBlock_4>>;
        getGasPrice: () => Promise<bigint>;
        getLogs: <const abiEvent_1 extends import("viem").AbiEvent | undefined = undefined, const abiEvents_1 extends readonly unknown[] | readonly import("viem").AbiEvent[] | undefined = abiEvent_1 extends import("viem").AbiEvent ? [abiEvent_1] : undefined, strict_6 extends boolean | undefined = undefined, fromBlock_5 extends bigint | import("viem").BlockTag | undefined = undefined, toBlock_5 extends bigint | import("viem").BlockTag | undefined = undefined>(args?: import("viem").GetLogsParameters<abiEvent_1, abiEvents_1, strict_6, fromBlock_5, toBlock_5> | undefined) => Promise<import("viem").GetLogsReturnType<abiEvent_1, abiEvents_1, strict_6, fromBlock_5, toBlock_5>>;
        getProof: (args: import("viem").GetProofParameters) => Promise<import("viem").GetProofReturnType>;
        estimateMaxPriorityFeePerGas: <chainOverride_3 extends import("viem").Chain | undefined = undefined>(args?: {
            chain: chainOverride_3 | null;
        } | undefined) => Promise<bigint>;
        getStorageAt: (args: import("viem").GetStorageAtParameters) => Promise<import("viem").GetStorageAtReturnType>;
        getTransaction: <blockTag_1 extends import("viem").BlockTag = "latest">(args: import("viem").GetTransactionParameters<blockTag_1>) => Promise<{
            [x: string]: any;
            [x: number]: any;
            [x: symbol]: any;
            blockHash: (blockTag_1 extends "pending" ? true : false) extends infer T_4 ? T_4 extends (blockTag_1 extends "pending" ? true : false) ? T_4 extends true ? null : `0x${string}` : never : never;
            blockNumber: (blockTag_1 extends "pending" ? true : false) extends infer T_5 ? T_5 extends (blockTag_1 extends "pending" ? true : false) ? T_5 extends true ? null : bigint : never : never;
            transactionIndex: (blockTag_1 extends "pending" ? true : false) extends infer T_6 ? T_6 extends (blockTag_1 extends "pending" ? true : false) ? T_6 extends true ? null : number : never : never;
        }>;
        getTransactionConfirmations: (args: import("viem").GetTransactionConfirmationsParameters<any>) => Promise<bigint>;
        getTransactionCount: (args: import("viem").GetTransactionCountParameters) => Promise<number>;
        getTransactionReceipt: (args: import("viem").GetTransactionReceiptParameters) => Promise<any>;
        multicall: <const contracts extends readonly unknown[], allowFailure extends boolean = true>(args: import("viem").MulticallParameters<contracts, allowFailure>) => Promise<import("viem").MulticallReturnType<contracts, allowFailure>>;
        prepareTransactionRequest: <const request extends import("viem").PrepareTransactionRequestRequest<any, chainOverride_4>, chainOverride_4 extends import("viem").Chain | undefined = undefined, accountOverride_2 extends `0x${string}` | import("viem").Account | undefined = undefined>(args: import("viem").PrepareTransactionRequestParameters<any, import("viem").Account | undefined, chainOverride_4, accountOverride_2, request>) => Promise<import("viem").UnionRequiredBy<Extract<import("viem").UnionOmit<import("viem").ExtractChainFormatterParameters<import("viem").DeriveChain<any, chainOverride_4>, "transactionRequest", import("viem").TransactionRequest>, "from"> & (import("viem").DeriveChain<any, chainOverride_4> extends infer T_21 ? T_21 extends import("viem").DeriveChain<any, chainOverride_4> ? T_21 extends import("viem").Chain ? {
            chain: T_21;
        } : {
            chain?: undefined;
        } : never : never) & (import("viem").DeriveAccount<import("viem").Account | undefined, accountOverride_2> extends infer T_22 ? T_22 extends import("viem").DeriveAccount<import("viem").Account | undefined, accountOverride_2> ? T_22 extends import("viem").Account ? {
            account: T_22;
            from: `0x${string}`;
        } : {
            account?: undefined;
            from?: undefined;
        } : never : never), import("viem").IsNever<((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_23 ? T_23 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_23 extends "legacy" ? import("viem").TransactionRequestLegacy : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_24 ? T_24 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_24 extends "eip1559" ? import("viem").TransactionRequestEIP1559 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_25 ? T_25 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_25 extends "eip2930" ? import("viem").TransactionRequestEIP2930 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_26 ? T_26 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_26 extends "eip4844" ? import("viem").TransactionRequestEIP4844 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_27 ? T_27 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_27 extends "eip7702" ? import("viem").TransactionRequestEIP7702 : never : never : never)> extends true ? unknown : import("viem").ExactPartial<((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_28 ? T_28 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_28 extends "legacy" ? import("viem").TransactionRequestLegacy : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_29 ? T_29 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_29 extends "eip1559" ? import("viem").TransactionRequestEIP1559 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_30 ? T_30 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_30 extends "eip2930" ? import("viem").TransactionRequestEIP2930 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_31 ? T_31 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_31 extends "eip4844" ? import("viem").TransactionRequestEIP4844 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_32 ? T_32 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_32 extends "eip7702" ? import("viem").TransactionRequestEIP7702 : never : never : never)>> & {
            chainId?: number | undefined;
        }, (request["parameters"] extends readonly import("viem").PrepareTransactionRequestParameterType[] ? request["parameters"][number] : "type" | "chainId" | "gas" | "nonce" | "blobVersionedHashes" | "fees") extends infer T_33 ? T_33 extends (request["parameters"] extends readonly import("viem").PrepareTransactionRequestParameterType[] ? request["parameters"][number] : "type" | "chainId" | "gas" | "nonce" | "blobVersionedHashes" | "fees") ? T_33 extends "fees" ? "gasPrice" | "maxFeePerGas" | "maxPriorityFeePerGas" : T_33 : never : never> & (unknown extends request["kzg"] ? {} : Pick<request, "kzg">) extends infer T_7 ? { [K_1 in keyof T_7]: (import("viem").UnionRequiredBy<Extract<import("viem").UnionOmit<import("viem").ExtractChainFormatterParameters<import("viem").DeriveChain<any, chainOverride_4>, "transactionRequest", import("viem").TransactionRequest>, "from"> & (import("viem").DeriveChain<any, chainOverride_4> extends infer T_8 ? T_8 extends import("viem").DeriveChain<any, chainOverride_4> ? T_8 extends import("viem").Chain ? {
            chain: T_8;
        } : {
            chain?: undefined;
        } : never : never) & (import("viem").DeriveAccount<import("viem").Account | undefined, accountOverride_2> extends infer T_9 ? T_9 extends import("viem").DeriveAccount<import("viem").Account | undefined, accountOverride_2> ? T_9 extends import("viem").Account ? {
            account: T_9;
            from: `0x${string}`;
        } : {
            account?: undefined;
            from?: undefined;
        } : never : never), import("viem").IsNever<((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_10 ? T_10 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_10 extends "legacy" ? import("viem").TransactionRequestLegacy : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_11 ? T_11 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_11 extends "eip1559" ? import("viem").TransactionRequestEIP1559 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_12 ? T_12 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_12 extends "eip2930" ? import("viem").TransactionRequestEIP2930 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_13 ? T_13 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_13 extends "eip4844" ? import("viem").TransactionRequestEIP4844 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_14 ? T_14 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_14 extends "eip7702" ? import("viem").TransactionRequestEIP7702 : never : never : never)> extends true ? unknown : import("viem").ExactPartial<((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_15 ? T_15 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_15 extends "legacy" ? import("viem").TransactionRequestLegacy : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_16 ? T_16 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_16 extends "eip1559" ? import("viem").TransactionRequestEIP1559 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_17 ? T_17 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_17 extends "eip2930" ? import("viem").TransactionRequestEIP2930 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_18 ? T_18 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_18 extends "eip4844" ? import("viem").TransactionRequestEIP4844 : never : never : never) | ((request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) extends infer T_19 ? T_19 extends (request["type"] extends string | undefined ? request["type"] : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)> extends "legacy" ? unknown : import("viem").GetTransactionType<request, (request extends {
            accessList?: undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
        } & import("viem").FeeValuesLegacy ? "legacy" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } & (import("viem").OneOf<{
            maxFeePerGas: bigint;
        } | {
            maxPriorityFeePerGas: bigint;
        }, import("viem").FeeValuesEIP1559> & {
            accessList?: import("viem").AccessList | undefined;
        }) ? "eip1559" : never) | (request extends {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: bigint | undefined;
            sidecars?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: undefined;
            maxPriorityFeePerGas?: undefined;
        } & {
            accessList: import("viem").AccessList | undefined;
        } ? "eip2930" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: undefined;
            blobs?: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
            blobVersionedHashes?: readonly `0x${string}`[] | undefined;
            maxFeePerBlobGas?: bigint | undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }) & (import("viem").ExactPartial<import("viem").FeeValuesEIP4844> & import("viem").OneOf<{
            blobs: readonly `0x${string}`[] | readonly Uint8Array[] | undefined;
        } | {
            blobVersionedHashes: readonly `0x${string}`[] | undefined;
        } | {
            sidecars: false | readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
        }, import("viem").TransactionSerializableEIP4844>) ? "eip4844" : never) | (request extends ({
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        } | {
            accessList?: import("viem").AccessList | undefined;
            authorizationList?: import("viem").SignedAuthorizationList | undefined;
            blobs?: undefined;
            blobVersionedHashes?: undefined;
            gasPrice?: undefined;
            maxFeePerBlobGas?: undefined;
            maxFeePerGas?: bigint | undefined;
            maxPriorityFeePerGas?: bigint | undefined;
            sidecars?: undefined;
        }) & {
            authorizationList: import("viem").SignedAuthorizationList;
        } ? "eip7702" : never) | (request["type"] extends string | undefined ? Extract<request["type"], string> : never)>) ? T_19 extends "eip7702" ? import("viem").TransactionRequestEIP7702 : never : never : never)>> & {
            chainId?: number | undefined;
        }, (request["parameters"] extends readonly import("viem").PrepareTransactionRequestParameterType[] ? request["parameters"][number] : "type" | "chainId" | "gas" | "nonce" | "blobVersionedHashes" | "fees") extends infer T_20 ? T_20 extends (request["parameters"] extends readonly import("viem").PrepareTransactionRequestParameterType[] ? request["parameters"][number] : "type" | "chainId" | "gas" | "nonce" | "blobVersionedHashes" | "fees") ? T_20 extends "fees" ? "gasPrice" | "maxFeePerGas" | "maxPriorityFeePerGas" : T_20 : never : never> & (unknown extends request["kzg"] ? {} : Pick<request, "kzg">))[K_1]; } : never>;
        readContract: <const abi_5 extends import("viem").Abi | readonly unknown[], functionName_1 extends import("viem").ContractFunctionName<abi_5, "view" | "pure">, const args_2 extends import("viem").ContractFunctionArgs<abi_5, "view" | "pure", functionName_1>>(args: import("viem").ReadContractParameters<abi_5, functionName_1, args>) => Promise<import("viem").ReadContractReturnType<abi_5, functionName_1, args>>;
        sendRawTransaction: (args: import("viem").SendRawTransactionParameters) => Promise<`0x${string}`>;
        sendRawTransactionSync: (args: import("viem").SendRawTransactionSyncParameters) => Promise<any>;
        simulate: <const calls extends readonly unknown[]>(args: import("viem").SimulateBlocksParameters<calls>) => Promise<import("viem").SimulateBlocksReturnType<calls>>;
        simulateBlocks: <const calls_1 extends readonly unknown[]>(args: import("viem").SimulateBlocksParameters<calls_1>) => Promise<import("viem").SimulateBlocksReturnType<calls_1>>;
        simulateCalls: <const calls_2 extends readonly unknown[]>(args: import("viem").SimulateCallsParameters<calls_2>) => Promise<import("viem").SimulateCallsReturnType<calls_2>>;
        simulateContract: <const abi_6 extends import("viem").Abi | readonly unknown[], functionName_2 extends import("viem").ContractFunctionName<abi_6, "nonpayable" | "payable">, const args_3 extends import("viem").ContractFunctionArgs<abi_6, "nonpayable" | "payable", functionName_2>, chainOverride_5 extends import("viem").Chain | undefined, accountOverride_3 extends `0x${string}` | import("viem").Account | undefined = undefined>(args: import("viem").SimulateContractParameters<abi_6, functionName_2, args_3, any, chainOverride_5, accountOverride_3>) => Promise<import("viem").SimulateContractReturnType<abi_6, functionName_2, args_3, any, import("viem").Account | undefined, chainOverride_5, accountOverride_3>>;
        verifyHash: (args: import("viem").VerifyHashActionParameters) => Promise<boolean>;
        verifyMessage: (args: {
            address: `0x${string}`;
            chain?: import("viem").Chain | null | undefined;
            blockNumber?: bigint | undefined;
            blockTag?: import("viem").BlockTag | undefined;
            factory?: `0x${string}` | undefined;
            factoryData?: `0x${string}` | undefined;
            erc6492VerifierAddress?: `0x${string}` | undefined;
            multicallAddress?: `0x${string}` | undefined;
            signature: Uint8Array | `0x${string}` | import("viem").Signature;
            universalSignatureVerifierAddress?: `0x${string}` | undefined;
            message: import("viem").SignableMessage;
        }) => Promise<boolean>;
        verifySiweMessage: (args: {
            blockNumber?: bigint | undefined;
            blockTag?: import("viem").BlockTag | undefined;
            address?: `0x${string}` | undefined;
            nonce?: string | undefined;
            domain?: string | undefined;
            scheme?: string | undefined;
            time?: Date | undefined;
            message: string;
            signature: `0x${string}`;
        }) => Promise<boolean>;
        verifyTypedData: (args: import("viem").VerifyTypedDataActionParameters) => Promise<boolean>;
        uninstallFilter: (args: import("viem").UninstallFilterParameters) => Promise<boolean>;
        waitForTransactionReceipt: (args: import("viem").WaitForTransactionReceiptParameters<any>) => Promise<any>;
        watchBlockNumber: (args: import("viem").WatchBlockNumberParameters) => import("viem").WatchBlockNumberReturnType;
        watchBlocks: <includeTransactions_1 extends boolean = false, blockTag_2 extends import("viem").BlockTag = "latest">(args: import("viem").WatchBlocksParameters<import("viem").HttpTransport<undefined, false>, any, includeTransactions_1, blockTag_2>) => import("viem").WatchBlocksReturnType;
        watchContractEvent: <const abi_7 extends import("viem").Abi | readonly unknown[], eventName_4 extends import("viem").ContractEventName<abi_7>, strict_7 extends boolean | undefined = undefined>(args: import("viem").WatchContractEventParameters<abi_7, eventName_4, strict_7, import("viem").HttpTransport<undefined, false>>) => import("viem").WatchContractEventReturnType;
        watchEvent: <const abiEvent_2 extends import("viem").AbiEvent | undefined = undefined, const abiEvents_2 extends readonly unknown[] | readonly import("viem").AbiEvent[] | undefined = abiEvent_2 extends import("viem").AbiEvent ? [abiEvent_2] : undefined, strict_8 extends boolean | undefined = undefined>(args: import("viem").WatchEventParameters<abiEvent_2, abiEvents_2, strict_8, import("viem").HttpTransport<undefined, false>>) => import("viem").WatchEventReturnType;
        watchPendingTransactions: (args: import("viem").WatchPendingTransactionsParameters<import("viem").HttpTransport<undefined, false>>) => import("viem").WatchPendingTransactionsReturnType;
        extend: <const client extends {
            [x: string]: unknown;
            account?: undefined;
            batch?: undefined;
            cacheTime?: undefined;
            ccipRead?: undefined;
            chain?: undefined;
            dataSuffix?: undefined;
            experimental_blockTag?: undefined;
            key?: undefined;
            name?: undefined;
            pollingInterval?: undefined;
            request?: undefined;
            transport?: undefined;
            type?: undefined;
            uid?: undefined;
        } & import("viem").ExactPartial<Pick<import("viem").PublicActions<import("viem").HttpTransport<undefined, false>, any, undefined>, "getChainId" | "prepareTransactionRequest" | "sendRawTransaction" | "call" | "createContractEventFilter" | "createEventFilter" | "estimateContractGas" | "estimateGas" | "getBlock" | "getBlockNumber" | "getContractEvents" | "getEnsText" | "getFilterChanges" | "getGasPrice" | "getLogs" | "getTransaction" | "getTransactionCount" | "getTransactionReceipt" | "readContract" | "simulateContract" | "uninstallFilter" | "watchBlockNumber" | "watchContractEvent"> & Pick<import("viem").WalletActions<any, undefined>, "sendTransaction" | "writeContract">>>(fn: (client: import("viem").Client<import("viem").HttpTransport<undefined, false>, any, undefined, import("viem").PublicRpcSchema, import("viem").PublicActions<import("viem").HttpTransport<undefined, false>, any>>) => client) => import("viem").Client<import("viem").HttpTransport<undefined, false>, any, undefined, import("viem").PublicRpcSchema, { [K_2 in keyof client]: client[K_2]; } & import("viem").PublicActions<import("viem").HttpTransport<undefined, false>, any>>;
    };
    walletClient: any;
    chain: any;
};
/**
 * Set a spend policy for a token. Only callable by the NFT owner.
 * Use NATIVE_TOKEN (address(0)) for native ETH.
 */
export declare function setSpendPolicy(wallet: any, policy: any): Promise<any>;
/**
 * Execute a transaction as the agent. If within limits, executes immediately.
 * If over limits, queues for owner approval and returns the pending tx ID.
 */
export declare function agentExecute(wallet: any, params: any): Promise<{
    executed: boolean;
    txHash: any;
}>;
/**
 * Check remaining autonomous budget for a token.
 */
export declare function checkBudget(wallet: any, token?: "0x0000000000000000000000000000000000000000"): Promise<{
    token: "0x0000000000000000000000000000000000000000";
    perTxLimit: any;
    remainingInPeriod: any;
}>;
/**
 * Get a pending transaction by ID.
 */
export declare function getPendingApprovals(wallet: any, fromId: bigint | undefined, toId: any): Promise<{
    txId: bigint;
    to: any;
    value: any;
    data: string;
    token: any;
    amount: any;
    createdAt: number;
    executed: any;
    cancelled: any;
}[]>;
/**
 * Approve a pending transaction. Only callable by the NFT owner.
 */
export declare function approveTransaction(wallet: any, txId: any): Promise<any>;
/**
 * Cancel a pending transaction. Only callable by the NFT owner.
 */
export declare function cancelTransaction(wallet: any, txId: any): Promise<any>;
/**
 * Add or remove an operator (agent hot wallet).
 */
export declare function setOperator(wallet: any, operator: any, authorized: any): Promise<any>;
/**
 * Transfer ERC20 tokens as the agent, respecting spend limits.
 */
export declare function agentTransferToken(wallet: any, params: any): Promise<any>;
/**
 * Deploy a new AgentAccountV2 wallet via the factory (CREATE2).
 * Returns the deterministic wallet address.
 */
export declare function deployWallet(config: any): Promise<{
    walletAddress: unknown;
    txHash: any;
}>;
/**
 * Compute the deterministic wallet address without deploying.
 */
export declare function getWalletAddress(config: any): Promise<unknown>;
/**
 * [MAX-ADDED] Budget forecast with period-aware remaining capacity.
 * Why: Agents need to know not just "how much is left" but "when does budget reset"
 * so they can plan spending across time windows and avoid unnecessary queuing.
 */
export declare function getBudgetForecast(wallet: any, token: "0x0000000000000000000000000000000000000000" | undefined, now: any): Promise<{
    token: "0x0000000000000000000000000000000000000000";
    perTxLimit: any;
    remainingInPeriod: any;
    periodLimit: any;
    periodLength: number;
    periodSpent: any;
    periodStart: number;
    secondsUntilReset: number;
    utilizationPercent: number;
}>;
/**
 * [MAX-ADDED] Wallet health check — diagnostic snapshot for agent self-monitoring.
 * Why: Agents need a single-call way to verify their wallet is properly configured,
 * check operator status, and monitor queue depth before executing transactions.
 */
export declare function getWalletHealth(wallet: any, operatorsToCheck: never[] | undefined, tokensToCheck: "0x0000000000000000000000000000000000000000"[] | undefined, now: any): Promise<{
    address: any;
    tokenContract: any;
    tokenId: any;
    operatorEpoch: any;
    activeOperators: {
        address: never;
        active: any;
    }[];
    pendingQueueDepth: number;
    budgets: {
        token: "0x0000000000000000000000000000000000000000";
        perTxLimit: any;
        remainingInPeriod: any;
        periodLimit: any;
        periodLength: number;
        periodSpent: any;
        periodStart: number;
        secondsUntilReset: number;
        utilizationPercent: number;
    }[];
}>;
/**
 * [MAX-ADDED] Batch agent token transfers — multiple transfers in sequential calls.
 * Why: Agents often need to pay multiple recipients (tips, fees, splits). This helper
 * reduces boilerplate and returns all tx hashes. Each is a separate on-chain tx
 * (true batching would need a multicall contract, but this is the safe SDK-level helper).
 */
export declare function batchAgentTransfer(wallet: any, transfers: any): Promise<any[]>;
/**
 * [MAX-ADDED] Activity history — query past wallet events for self-auditing.
 * Why: Agents need to verify what happened on-chain (transfers, operator changes,
 * policy updates) without relying on external indexers. This queries event logs directly.
 */
export declare function getActivityHistory(wallet: any, options?: {}): Promise<{
    type: string;
    blockNumber: any;
    transactionHash: any;
    args: any;
}[]>;
/**
 * Watch for TransactionQueued events (over-limit transactions needing approval).
 * Returns an unwatch function.
 */
export declare function onTransactionQueued(wallet: any, callback: any): any;
/**
 * Watch for TransactionExecuted events.
 */
export declare function onTransactionExecuted(wallet: any, callback: any): any;
export { ERC8004Client, ERC8004IdentityRegistryAbi, METADATA_KEYS, REGISTRATION_FILE_TYPE, KNOWN_REGISTRY_ADDRESSES, buildDataURI, parseDataURI, resolveAgentURI, validateRegistrationFile, formatAgentRegistry, } from './identity/erc8004.js';
export { SwapModule, attachSwap, calcProtocolFee, applySlippage, calcDeadline } from './swap/index.js';
export { UniswapV3RouterAbi, UniswapV3QuoterV2Abi, ERC20Abi } from './swap/index.js';
export { BASE_TOKENS, UNISWAP_V3_BASE, PROTOCOL_FEE_BPS, DEFAULT_SLIPPAGE_BPS } from './swap/index.js';
export { BridgeModule, BridgeError, createBridge, CCTP_DOMAIN_IDS, BRIDGE_CHAIN_IDS, USDC_CONTRACT, TOKEN_MESSENGER_V2, MESSAGE_TRANSMITTER_V2, FINALITY_THRESHOLD, } from './bridge/index.js';
export { TokenMessengerV2Abi, MessageTransmitterV2Abi, ERC20BridgeAbi } from './bridge/index.js';
export { SpendingPolicy, } from './policy/SpendingPolicy.js';
export { deriveAgentDID, issueCredential, verifyCredential, exportDIDDocument, } from './identity/did.js';
export { AgentStakingPool, } from './staking/AgentStakingPool.js';
export { verifyAgent, verifyTrustBundle, } from './verify/verifyAgent.js';
//# sourceMappingURL=index.d.ts.map