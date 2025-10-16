import type { NextApiRequest, NextApiResponse } from "next";
const { buildPoseidon } = require("circomlibjs");
const snarkjs = require("snarkjs");
const ff = require("ffjavascript");
import random from "seedrandom";
import path from "path";
import fs from "fs";

// Read files so Vercel bundles them with the serverless function
fs.readFileSync(
  path.join(process.cwd(), "circuits/mastermind/keys/circuit.wasm")
);
fs.readFileSync(
  path.join(process.cwd(), "circuits/mastermind/keys/circuit_final.zkey")
);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { guess, numPartial, numCorrect } = req.body.guessData;
  const initKey = BigInt(req.body.initKey);

  const CURRENT_ZKMASTERMIND_RELEASE_ID = 0x1001;
  const ARCADE_LOCAL_SEED = process.env.ARCADE_LOCAL_SEED ? BigInt(process.env.ARCADE_LOCAL_SEED) : 0n;
  const INIT_SALT = process.env.INIT_SALT ? BigInt(process.env.INIT_SALT) : 0n;
  const CODE_SIZE = 4;
  const NUM_ROWS = 10;
  const NUM_COLORS = 8;
  const REAL_ROWS = numPartial.length;
  if (REAL_ROWS > NUM_ROWS || numCorrect.length != REAL_ROWS || guess.length != REAL_ROWS * CODE_SIZE) {
    return res.status(400).json({ 'error': 'Format error in guess data' });
  }
  const SCORE_FACTORS = process.env.SCORE_FACTORS ? (JSON.parse(process.env.SCORE_FACTORS)).slice(0, CODE_SIZE) : [3, 8, 25, 90];

  const initSeed = initKey + ARCADE_LOCAL_SEED + INIT_SALT;
  const generator = random(initSeed.toString());
  const solution = [];
  for (let i = 0; i < CODE_SIZE; i++) {
    solution.push(Math.floor(generator.quick() * NUM_COLORS));
  }

  const poseidon = await buildPoseidon();
  const localHash = poseidon.F.toObject(poseidon([CURRENT_ZKMASTERMIND_RELEASE_ID, 0, ARCADE_LOCAL_SEED, 0, INIT_SALT])).toString();
  const inputs = {
    localHash,
    arcadeLocalSeed: ARCADE_LOCAL_SEED,
    gameInitializationSalt: INIT_SALT,
    guess,
    numPartial,
    numCorrect,
    solution,
    scoreFactor: SCORE_FACTORS,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    "circuits/mastermind/keys/circuit.wasm",
    "circuits/mastermind/keys/circuit_final.zkey"
  );

  // required to generate solidity call params
  const editedPublicSignals = ff.utils.unstringifyBigInts(publicSignals);
  const editedProof = ff.utils.unstringifyBigInts(proof);

  // Generate solidity compatible params for Verifier.sol
  const calldata = await snarkjs.groth16.exportSolidityCallData(
    editedProof,
    editedPublicSignals
  );

  return res.status(200).json({
    proof,
    publicSignals,
    calldata: JSON.parse(`[${calldata}]`),
  });
};

export default handler;
