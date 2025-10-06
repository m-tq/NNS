import { ethers } from 'ethers'

export function namehash(name: string): string {
  let node: Uint8Array = new Uint8Array(32)
  if (!name) {
    return ethers.hexlify(node)
  }
  const labels = name.toLowerCase().split('.')
  for (let i = labels.length - 1; i >= 0; i--) {
    const labelHash = ethers.keccak256(ethers.toUtf8Bytes(labels[i]))
    const labelBytes = ethers.getBytes(labelHash)
    const buf = new Uint8Array(node.length + labelBytes.length)
    buf.set(node, 0)
    buf.set(labelBytes, node.length)
    node = ethers.getBytes(ethers.keccak256(buf)) as Uint8Array
  }
  return ethers.hexlify(node)
}