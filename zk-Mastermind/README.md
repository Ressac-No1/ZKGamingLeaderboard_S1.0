# A Mastermind (code breaking) game with leaderboard

Mastermind is a simple 2-player board game, in which the goal of the code breaker is to correctly guess (or break) the code pattern set by the code maker in as few guess rounds as possible. Zero-knowledge proofs generated on ZK circuit description models (such as Circom language or Risc0 ZKVM) are capable to prove the correctness and evaluate excellence of the code breaker's guess attempts without the leaking risk of any detailed data. We select an original Mastermind game implemented with ZK proofs and develop a proof submission module in the game to send the ZK proofs of gameplay on [ZkVerify](https://zkverify.io) Volta testnet for on-chain verification in a time- and gas-saving manner. In addition, we also redesign the Circom circuit of the original game to authenticate the entire gameplay data in a Poseidon hash and assign a score for the gameplay that is defined as the number its unused guess rounds plus 1.

The author of the original project is [adam-maj](https://github.com/adam-maj/zk-mastermind). We launched this project in Sept. 2024 at [EthWarsaw Hackathon](https://devfolio.co/projects/zkmastermindetherwarsawedition-d904) with the help of the core team of ZkVerify.

![Verifiable zkMastermind](/public/ZKVerifiableMastermind.png)

## Team members & roles

- RSSCNo1: The initializer and game logic & backend developer of the zkVerify gaming leaderboard project
- Ivan Kalkaev & Marie Melnikova & Alice Skhabovska: Frontend UI/UX designers and developers from Unipaws team

