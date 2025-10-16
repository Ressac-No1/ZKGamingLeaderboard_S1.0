import type { NextApiRequest, NextApiResponse } from "next";
import random from "seedrandom";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    const initKey = BigInt(req.query.initKey);
    const ARCADE_LOCAL_SEED = process.env.ARCADE_LOCAL_SEED ? BigInt(process.env.ARCADE_LOCAL_SEED) : 0n;
    const INIT_SALT = process.env.INIT_SALT ? BigInt(process.env.INIT_SALT) : 0n;
    const CODE_SIZE = 4;
    const NUM_COLORS = 8;

    const initSeed = initKey + ARCADE_LOCAL_SEED + INIT_SALT;
    const generator = random(initSeed.toString());
    const solution = [];
    for (let i = 0; i < CODE_SIZE; i++) {
      solution.push(Math.floor(generator.quick() * NUM_COLORS));
    }

    const guess = JSON.parse(req.query.guess);
    const colorCountOfGuess = Array(NUM_COLORS + 1).fill(0);
    const colorCountOfSolution = Array(NUM_COLORS + 1).fill(0);
    let correct = 0;
    for (let i = 0; i < CODE_SIZE; i++)
      if (guess[i] == solution[i])
        correct++;
      else {
        colorCountOfGuess[guess[i]]++;
        colorCountOfSolution[solution[i]]++;
      }
    let partial = 0;
    for (let i = 0; i < NUM_COLORS; i++)
      partial += Math.min(colorCountOfGuess[i], colorCountOfSolution[i]);

    return res.status(200).json({ correct, partial });
  } else
    return res.status(405).end();
};

export default handler;
