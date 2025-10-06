import { keccak_256 } from "js-sha3";

export type ResolveOptions = {
  rpcUrl?: string;
  registryAddress?: string;
  defaultResolverAddress?: string;
};

const DEFAULTS: Required<ResolveOptions> = {
  rpcUrl: "https://testnet3.rpc.nexus.xyz",
  registryAddress: "0x35481Ed34c3E6446EaafDca622369Df4295dce31",
  defaultResolverAddress: "0x3C7bc6E4C65A194B3Bec187a3D6ef97A61F9DcD5",
};

function toHex(input: Uint8Array): string {
  return "0x" + Array.from(input).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (h.length % 2 !== 0) throw new Error("Invalid hex length");
  const arr = new Uint8Array(h.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(h.substr(i * 2, 2), 16);
  return arr;
}

function pad32(hex: string): string {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  return "0x" + h.padStart(64, "0");
}

function selector(signature: string): string {
  const digest = keccak_256(signature);
  return "0x" + digest.substring(0, 8);
}

function labelhash(label: string): string {
  const enc = new TextEncoder().encode(label);
  const digest = keccak_256(enc);
  return "0x" + digest;
}

export function namehash(name: string): string {
  if (!name) return "0x" + "00".repeat(32);
  const labels = name.split(".");
  let node = new Uint8Array(32);
  for (let i = labels.length - 1; i >= 0; i--) {
    const labelDigestHex = labelhash(labels[i]);
    const labelDigest = hexToBytes(labelDigestHex);
    const buffer = new Uint8Array(64);
    buffer.set(node, 0);
    buffer.set(labelDigest, 32);
    const nh = keccak_256(buffer);
    node = hexToBytes("0x" + nh);
  }
  return toHex(node);
}

async function rpcCallEthCall(rpcUrl: string, to: string, data: string): Promise<string> {
  const body = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 1e9),
    method: "eth_call",
    params: [
      { to, data },
      "latest"
    ]
  };

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`RPC error: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "RPC returned error");
  return json.result as string;
}

function decodeAddressFrom32Bytes(hexWord: string): string {
  const h = hexWord.startsWith("0x") ? hexWord.slice(2) : hexWord;
  const addr = "0x" + h.slice(24 * 2, 32 * 2);
  return addr.toLowerCase();
}

export async function resolveNex(
  name: string,
  options?: ResolveOptions
): Promise<string | null> {
  const opts = { ...DEFAULTS, ...(options || {}) };
  if (!name || !name.endsWith(".nex")) throw new Error("Name must end with .nex");
  const baseRemoved = name.slice(0, -4);
  if (!baseRemoved) throw new Error("Invalid name");

  const node = namehash(`${baseRemoved}.nex`);

  const resolverSig = selector("resolver(bytes32)");
  const resolverData = resolverSig + (pad32(node).slice(2));
  let resolverAddressWord: string;
  try {
    resolverAddressWord = await rpcCallEthCall(opts.rpcUrl, opts.registryAddress, resolverData);
  } catch (e) {
    resolverAddressWord = pad32(opts.defaultResolverAddress);
  }
  const resolverAddress = decodeAddressFrom32Bytes(resolverAddressWord);

  const addrSig = selector("addr(bytes32)");
  const addrData = addrSig + (pad32(node).slice(2));
  const addrWord = await rpcCallEthCall(opts.rpcUrl, resolverAddress, addrData);
  const resolved = decodeAddressFrom32Bytes(addrWord);
  if (resolved === "0x0000000000000000000000000000000000000000") {
    return null;
  }
  return resolved;
}