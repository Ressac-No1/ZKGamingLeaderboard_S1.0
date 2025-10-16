import type { NextApiRequest, NextApiResponse } from "next";
import axios from 'axios';
import path from "path";
import fs from "fs";

// Load the verfication key to register on the HL relayer
const vk = fs.readFileSync(
  path.join(process.cwd(), "circuits/mastermind/keys/circuit_final.zkey")
);

const whereIsVkRegStatus = path.join(process.cwd(), "config/VKeyRegistrationStatus.json");

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    try {
      const vkRegStatus = JSON.parse(fs.readFileSync(whereIsVkRegStatus));
      if (vkRegStatus && vkRegStatus.VKey && vkRegStatus.Status)
        return res.status(200).json(vkRegStatus);
      else
        return res.status(200).json({ "Status": "VKey not registered" })
    } catch (err) {
      return res.status(500).json(err);
    }
  } else if (req.method === "POST") {
    const { proofType, proofOptions } = req.body;
    if (!proofType || !proofOptions) {
      return res.status(400).json({ "error": "must provide proof type and proof options for verification key registration" });
    }
    const API_URL = `${process.env.API_BASE_URL}/register-vk/${process.env.API_KEY}`;
  
    const regParams = {
      proofType,
      proofOptions,
      vk,
    };

    try {
      const regRes = await axios.post(API_URL, regParams);
      console.log(regRes);
      fs.writeFileSync(
        whereIsVkRegStatus,
        JSON.stringify({
          "VKey": vk,
          "Status": regRes.data,
        })
      );
      return res.status(200).json({
        "VKey": vk
      });
    } catch (err) {
      fs.writeFileSync(
        whereIsVkRegStatus,
        JSON.stringify({
          "VKey": vk,
          "Error": err.response.data,
        })
      );
      return res.status(500).end();
    }
  } else
    return res.status(405).end();
};

export default handler;
