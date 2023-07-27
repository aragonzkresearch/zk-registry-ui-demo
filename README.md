# zk-registry-demo

Onchain ZK Registry demo.

**TL;DR**: users register a baby jubjub key onchain to be used for zk proof voting contracts

This project builds on top of [OAV](https://github.com/aragonzkresearch/ovote#oav-onchain-anonymous-voting) circuits, which follows a similar design done in [vocdoni/zk-franchise-proof](https://github.com/vocdoni/zk-franchise-proof-circuit) and [Semaphore](https://semaphore.appliedzkp.org/).
The census in this project is compatible with [OVOTE](https://github.com/aragonzkresearch/research/blob/main/ovote/ovote.pdf) census, and a similar circuit design but implemented in arkworks can be found at [ark-anon-vote](https://github.com/aragonzkresearch/ark-anon-vote).

Target:
- DAOs
- That want to have anonymous on-chain voting
- Which members are willing to pay gas costs (or DAO refunds it)


## Packages
- [clientlib](https://github.com/aragonzkresearch/nouns-zk-registry-demo/tree/main/clientlib)
- [react-ui](https://github.com/aragonzkresearch/nouns-zk-registry-demo/tree/main/react-ui)

