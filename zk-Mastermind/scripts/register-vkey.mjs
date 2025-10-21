import axios from 'axios';
import path from "path";
import fs from "fs";

async function run(
  pathOfOriginalVKey,
  pathOfRegisteredVKey,
  proofType,
  proofOptions
) {
  if (!proofType || !proofOptions) {
    return res.status(400).json({ "error": "must provide proof type and proof options for verification key registration" });
  }
  const API_URL = `${process.env.API_BASE_URL}/register-vk/${process.env.API_KEY}`;

  const vk = JSON.parse(fs.readFileSync(pathOfOriginalVKey));
  const regParams = {
    proofType,
    proofOptions,
    vk,
  };

  try {
    const regRes = await axios.post(API_URL, regParams);
    const vkHash = regRes.data.vkHash;
    console.log(`Verification key registered! VkHash: ${vkHash}`);
    fs.writeFileSync(
      pathOfRegisteredVKey,
      JSON.stringify({
        "VKey": vk,
        "vkHash": vkHash,
      })
    );
  } catch (err) {
    console.log(err.response.data.message);
  }
}

await run(
  "circuits/mastermind/keys/verification_key.json",
  "config/registered_verification_key.json",
  "groth16",
  {
    "library": "snarkjs",
    "curve": "bn128",
  }
);

