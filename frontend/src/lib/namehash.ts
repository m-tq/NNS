import { ethers } from 'ethers'

export function namehash(name: string): string {
  let node = new Uint8Array(32)
  if (!name) {
    return ethers.hexlify(node)
  }
  const labels = name.toLowerCase().split('.')
  for (let i = labels.length - 1; i >= 0; i--) {
    const labelHash = ethers.keccak256(ethers.toUtf8Bytes(labels[i]))
    const buf = ethers.concat([node, ethers.getBytes(labelHash)])
    node = ethers.getBytes(ethers.keccak256(buf))
  }
  return ethers.hexlify(node)
}