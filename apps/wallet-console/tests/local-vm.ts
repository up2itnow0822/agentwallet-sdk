import { readFileSync } from "node:fs";
import solc from "solc";
import { createVM, runTx } from "@ethereumjs/vm";
import { createCustomCommon, Mainnet, Hardfork } from "@ethereumjs/common";
import { createLegacyTx } from "@ethereumjs/tx";
import { createBlock } from "@ethereumjs/block";
import {
  createAccount,
  createAddressFromPrivateKey,
  createAddressFromString,
  bytesToHex,
  hexToBytes,
} from "@ethereumjs/util";
import {
  encodeDeployData,
  encodeFunctionData,
  keccak256,
  toHex,
  zeroAddress,
  padHex,
  type Address,
  type Hex,
} from "viem";
import { compileContracts } from "../../../scripts/contracts/compile.mjs";
export async function fixture(cctp = false) {
  const compiled = compileContracts(true);
  const extra = JSON.parse(
    solc.compile(
      JSON.stringify({
        language: "Solidity",
        sources: {
          "Browser.sol": {
            content: readFileSync(
              new URL("./CctpFixtures.sol", import.meta.url),
              "utf8",
            ),
          },
        },
        settings: {
          viaIR: true,
          evmVersion: "cancun",
          optimizer: { enabled: true, runs: 200 },
          outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
        },
      }),
    ),
  );
  if (extra.errors?.some((e: { severity: string }) => e.severity === "error"))
    throw Error(JSON.stringify(extra.errors));
  compiled.contracts["Browser.sol"] = extra.contracts["Browser.sol"];
  const common = createCustomCommon({ chainId: 84532 }, Mainnet, {
    hardfork: Hardfork.Cancun,
  });
  const vm = await createVM({ common });
  // Disposable local VM identities only. Never use on a public network.
  const keys = [1, 2, 3].map((n) => new Uint8Array(32).fill(n));
  const accounts = keys.map(
    (k) => createAddressFromPrivateKey(k).toString() as Address,
  );
  let blockNumber = 1n;
  const timestamp = BigInt(Math.floor(Date.now() / 1000));
  const block = () =>
    createBlock(
      {
        header: {
          number: blockNumber,
          timestamp: timestamp + blockNumber,
          gasLimit: 30000000n,
          baseFeePerGas: 0n,
        },
      },
      { common },
    );
  for (const a of accounts)
    await vm.stateManager.putAccount(
      createAddressFromString(a),
      createAccount({ balance: 10n ** 24n }),
    );
  async function send(
    from: Address,
    to: Address | undefined,
    data: Hex = "0x",
    value = 0n,
  ) {
    const key =
      keys[accounts.findIndex((a) => a.toLowerCase() === from.toLowerCase())];
    if (!key) throw Error("Unknown local signer");
    const a = await vm.stateManager.getAccount(createAddressFromString(from));
    const tx = createLegacyTx(
      {
        nonce: a!.nonce,
        gasLimit: 8000000n,
        gasPrice: 1n,
        to,
        value,
        data: hexToBytes(data),
      },
      { common },
    ).sign(key);
    const result = await runTx(vm, { tx, block: block() });
    blockNumber++;
    return { result, hash: bytesToHex(tx.hash()) as Hex };
  }
  async function deploy(
    file: string,
    name: string,
    args: readonly unknown[] = [],
  ) {
    const a = compiled.contracts[file][name];
    const r = await send(
      accounts[0],
      undefined,
      encodeDeployData({
        abi: a.abi,
        bytecode: `0x${a.evm.bytecode.object}`,
        args,
      }),
    );
    if (r.result.execResult.exceptionError)
      throw Error("Fixture deployment failed");
    return {
      address: r.result.createdAddress!.toString() as Address,
      abi: a.abi,
    };
  }
  const router = await deploy("tests/contracts/Adversaries.sol", "TestRouter"),
    pool = await deploy("tests/contracts/Adversaries.sol", "TestPool"),
    messenger = await deploy(
      "tests/contracts/Adversaries.sol",
      "TestMessenger",
    ),
    receiver = await deploy("tests/contracts/Adversaries.sol", "TestReceiver");
  const input = await deploy("tests/contracts/Adversaries.sol", "TestToken"),
    output = await deploy("tests/contracts/Adversaries.sol", "TestToken");
  const cctpToken = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address,
    cctpDestinationToken =
      "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
    cctpTransmitter = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as Address,
    cctpMessenger = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as Address;
  let circleTokenAbi: readonly unknown[] = [],
    transmitterHash: Hex | undefined;
  if (cctp) {
    for (const [name, addresses] of [
      ["BrowserUSDC", [cctpToken, cctpDestinationToken]],
      ["BrowserTransmitter", [cctpTransmitter]],
      ["BrowserMessenger", [cctpMessenger]],
    ] as const) {
      const deployed = await deploy("Browser.sol", name);
      const runtime = await vm.stateManager.getCode(
        createAddressFromString(deployed.address),
      );
      for (const a of addresses)
        await vm.stateManager.putCode(createAddressFromString(a), runtime);
      if (name === "BrowserUSDC") circleTokenAbi = deployed.abi;
      if (name === "BrowserTransmitter")
        transmitterHash = keccak256(bytesToHex(runtime));
    }
  }
  const vault = await deploy("contracts/AgentVault.sol", "AgentVault", [
    accounts[0],
    accounts[1],
    router.address,
    pool.address,
    cctp ? cctpMessenger : messenger.address,
    6,
  ]);
  await send(accounts[0], vault.address, "0x", 10n ** 19n);
  await send(
    accounts[0],
    vault.address,
    encodeFunctionData({
      abi: vault.abi,
      functionName: "setSpendPolicy",
      args: [zeroAddress, 10n ** 18n, 5n * 10n ** 18n, 86400n],
    }),
  );
  await send(
    accounts[0],
    vault.address,
    encodeFunctionData({
      abi: vault.abi,
      functionName: "setRecipient",
      args: [receiver.address, true],
    }),
  );
  for (const token of [input, output]) {
    await send(
      accounts[0],
      token.address,
      encodeFunctionData({
        abi: token.abi,
        functionName: "mint",
        args: [vault.address, 1000n * 10n ** 18n],
      }),
    );
    await send(
      accounts[0],
      vault.address,
      encodeFunctionData({
        abi: vault.abi,
        functionName: "setSpendPolicy",
        args: [token.address, 100n * 10n ** 18n, 500n * 10n ** 18n, 86400n],
      }),
    );
  }
  await send(
    accounts[0],
    vault.address,
    encodeFunctionData({
      abi: vault.abi,
      functionName: "setSwapPair",
      args: [input.address, output.address, 10n ** 18n, timestamp + 3600n],
    }),
  );
  await send(
    accounts[0],
    vault.address,
    encodeFunctionData({
      abi: vault.abi,
      functionName: "setBridgeDestination",
      args: [0, padHex(receiver.address, { size: 32 })],
    }),
  );
  for (const [from, to] of [
    [router.address, "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4"],
    [pool.address, "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27"],
    ...(!cctp
      ? [[messenger.address, "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA"]]
      : []),
  ])
    await vm.stateManager.putCode(
      createAddressFromString(to),
      await vm.stateManager.getCode(createAddressFromString(from)),
    );
  let destinationManifest: Record<string, unknown> | undefined;
  if (cctp) {
    const destination = await deploy("contracts/AgentVault.sol", "AgentVault", [
      accounts[0],
      accounts[1],
      router.address,
      pool.address,
      cctpMessenger,
      0,
    ]);
    const runtime = bytesToHex(
      await vm.stateManager.getCode(
        createAddressFromString(destination.address),
      ),
    ) as Hex;
    destinationManifest = {
      chainId: 11155111,
      vault: destination.address,
      runtimeCodeHash: keccak256(runtime),
      securityVersion: 1,
      assets: [],
      messageTransmitterCodeHash: transmitterHash,
    };
    await send(
      accounts[0],
      cctpToken,
      encodeFunctionData({
        abi: circleTokenAbi,
        functionName: "mint",
        args: [vault.address, 1000n * 10n ** 6n],
      }),
    );
    await send(
      accounts[0],
      vault.address,
      encodeFunctionData({
        abi: vault.abi,
        functionName: "setSpendPolicy",
        args: [cctpToken, 100n * 10n ** 6n, 500n * 10n ** 6n, 86400n],
      }),
    );
    await send(
      accounts[0],
      vault.address,
      encodeFunctionData({
        abi: vault.abi,
        functionName: "setBridgeDestination",
        args: [0, padHex(destination.address, { size: 32 })],
      }),
    );
  }
  const code = bytesToHex(
    await vm.stateManager.getCode(createAddressFromString(vault.address)),
  ) as Hex;
  const manifest = {
    chainId: 84532,
    vault: vault.address,
    runtimeCodeHash: keccak256(code),
    securityVersion: 1,
    assets: cctp
      ? [{ address: cctpToken, symbol: "USDC", decimals: 6 }]
      : [
          { address: input.address, symbol: "INPUT", decimals: 18 },
          { address: output.address, symbol: "OUTPUT", decimals: 18 },
        ],
  };
  let active = accounts[0];
  let currentChain = 84532;
  let writes = 0;
  let reject = false;
  let raceRevert = false;
  let receiptError = false;
  const receipts = new Map<string, unknown>();
  const transactions = new Map<string, unknown>();
  async function rawRpc({
    method,
    params = [],
  }: {
    method: string;
    params?: unknown[];
  }) {
    if (method === "eth_requestAccounts" || method === "eth_accounts")
      return [active];
    if (method === "eth_chainId") return toHex(currentChain);
    if (method === "eth_blockNumber") {
      blockNumber++;
      return toHex(blockNumber);
    }
    if (method === "eth_gasPrice") return "0x1";
    if (method === "eth_getCode")
      return bytesToHex(
        await vm.stateManager.getCode(
          createAddressFromString(params[0] as string),
        ),
      );
    if (method === "eth_getBalance")
      return toHex(
        (
          await vm.stateManager.getAccount(
            createAddressFromString(params[0] as string),
          )
        )?.balance ?? 0n,
      );
    if (method === "eth_getBlockByNumber")
      return {
        number: toHex(blockNumber),
        hash: "0x" + "ab".repeat(32),
        parentHash: "0x" + "cd".repeat(32),
        nonce: "0x0000000000000000",
        sha3Uncles: "0x" + "00".repeat(32),
        logsBloom: "0x" + "00".repeat(256),
        transactionsRoot: "0x" + "00".repeat(32),
        stateRoot: "0x" + "00".repeat(32),
        receiptsRoot: "0x" + "00".repeat(32),
        miner: zeroAddress,
        difficulty: "0x0",
        totalDifficulty: "0x0",
        extraData: "0x",
        size: "0x1",
        gasLimit: "0x1c9c380",
        gasUsed: "0x0",
        timestamp: toHex(timestamp + blockNumber),
        transactions: [],
        uncles: [],
        baseFeePerGas: "0x0",
      };
    if (method === "eth_call" || method === "eth_estimateGas") {
      const tx = params[0] as {
        from?: Address;
        to?: Address;
        data?: Hex;
        value?: Hex;
      };
      await vm.stateManager.checkpoint();
      try {
        const r = await vm.evm.runCall({
          caller: createAddressFromString(tx.from ?? active),
          to: tx.to ? createAddressFromString(tx.to) : undefined,
          data: hexToBytes(tx.data ?? "0x"),
          value: BigInt(tx.value ?? "0x0"),
          gasLimit: 8000000n,
          block: block(),
        });
        if (r.execResult.exceptionError)
          throw Error(
            "execution reverted: " + bytesToHex(r.execResult.returnValue),
          );
        return method === "eth_call"
          ? bytesToHex(r.execResult.returnValue)
          : toHex(r.execResult.executionGasUsed + 100000n);
      } finally {
        await vm.stateManager.revert();
      }
    }
    if (method === "eth_sendTransaction") {
      if (reject) throw Error("4001 User rejected request");
      const tx = params[0] as {
        from: Address;
        to?: Address;
        data: Hex;
        value?: Hex;
      };
      if (raceRevert)
        await send(
          accounts[0],
          receiver.address,
          encodeFunctionData({
            abi: receiver.abi,
            functionName: "configure",
            args: [zeroAddress, "0x", true],
          }),
        );
      const r = await send(tx.from, tx.to, tx.data, BigInt(tx.value ?? "0x0"));
      writes++;
      const logs = (r.result.execResult.logs ?? []).map((l, i) => ({
        address: bytesToHex(l[0]),
        topics: l[1].map(bytesToHex),
        data: bytesToHex(l[2]),
        blockNumber: toHex(blockNumber),
        transactionHash: r.hash,
        transactionIndex: "0x0",
        blockHash: "0x" + "ab".repeat(32),
        logIndex: toHex(i),
        removed: false,
      }));
      receipts.set(r.hash, {
        transactionHash: r.hash,
        transactionIndex: "0x0",
        blockHash: "0x" + "ab".repeat(32),
        blockNumber: toHex(blockNumber),
        from: tx.from,
        to: tx.to,
        cumulativeGasUsed: toHex(r.result.totalGasSpent),
        gasUsed: toHex(r.result.totalGasSpent),
        contractAddress: r.result.createdAddress?.toString() ?? null,
        logs,
        logsBloom: "0x" + "00".repeat(256),
        status: r.result.execResult.exceptionError ? "0x0" : "0x1",
        type: "0x0",
        effectiveGasPrice: "0x1",
      });
      transactions.set(r.hash, {
        hash: r.hash,
        from: tx.from,
        to: tx.to ?? null,
        input: tx.data,
        value: tx.value ?? "0x0",
        gas: "0x7a1200",
        gasPrice: "0x1",
        nonce: "0x0",
        blockNumber: toHex(blockNumber),
        blockHash: "0x" + "ab".repeat(32),
        transactionIndex: "0x0",
        type: "0x0",
      });
      return r.hash;
    }
    if (method === "eth_getTransactionByHash")
      return transactions.get(params[0] as string) ?? null;
    if (method === "eth_getTransactionReceipt" && receiptError)
      throw Error("network unavailable after submission");
    if (method === "eth_getTransactionReceipt")
      return receipts.get(params[0] as string) ?? null;
    throw Error("Unsupported fixture RPC " + method);
  }
  let rpcTail: Promise<unknown> = Promise.resolve();
  function rpc(payload: { method: string; params?: unknown[] }) {
    const next = rpcTail.then(() => rawRpc(payload));
    rpcTail = next.then(
      () => {},
      () => {},
    );
    return next;
  }
  return {
    manifest,
    destinationManifest,
    input: input.address,
    output: output.address,
    receiver: receiver.address,
    accounts,
    rpc,
    get writes() {
      return writes;
    },
    getAttested: (hash: string) => {
      const receipt = receipts.get(hash) as {
        logs: { address: string; data: Hex }[];
      };
      const log = receipt.logs.find(
        (l) => l.address.toLowerCase() === cctpTransmitter.toLowerCase(),
      );
      if (!log) throw Error("No fixture Circle log");
      const encoded = log.data.slice(2);
      const len = Number(BigInt("0x" + encoded.slice(64, 128)));
      const message = encoded.slice(128, 128 + len * 2);
      const chars = message.split("");
      const put = (offset: number, bytes: number, value: bigint) =>
        chars.splice(
          offset * 2,
          bytes * 2,
          ...value.toString(16).padStart(bytes * 2, "0"),
        );
      put(12, 32, 1n);
      put(144, 4, 2000n);
      return {
        sourceTxHash: hash,
        messages: [
          {
            status: "complete",
            cctpVersion: 2,
            message: "0x" + chars.join(""),
            attestation: "0x" + "11".repeat(65),
          },
        ],
      };
    },
    setAccount: (a: Address) => (active = a),
    setChain: (n: number) => (currentChain = n),
    setReject: (value: boolean) => (reject = value),
    setReceiptError: (v: boolean) => (receiptError = v),
    setRaceRevert: (v: boolean) => (raceRevert = v),
  };
}
