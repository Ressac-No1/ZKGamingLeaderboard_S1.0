import type { NextApiRequest, NextApiResponse } from "next";
const { buildPoseidon } = require("circomlibjs");
import random from 'crypto-random-bigint';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  //const { accountAddr } = req.body;
  const CURRENT_ZKMASTERMIND_RELEASE_ID = 0x1001;
  const ARCADE_LOCAL_SEED = process.env.ARCADE_LOCAL_SEED ? BigInt(process.env.ARCADE_LOCAL_SEED) : 0n;

  const poseidon = await buildPoseidon();
  const initSalt: BigInt = random(240);
  process.env.INIT_SALT = initSalt.toString();
  const localHash = poseidon.F.toObject(poseidon([CURRENT_ZKMASTERMIND_RELEASE_ID, 0, ARCADE_LOCAL_SEED, 0, initSalt])).toString();
  
  // TODO: Here should apply a initialization key from an on-chain Verifiable Random Function
  const initKey: BigInt = random(240);

  return res.status(200).json({
    initKey: initKey.toString(),
  });
};

export default handler;
