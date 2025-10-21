import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import fs from "fs";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const PATH_OF_REGISTERED_VKEY = "config/registered_verification_key.json";
  const PATH_OF_ORIGINAL_VKEY = "circuits/mastermind/keys/verification_key.json";
  const vkRegistered = fs.existsSync(PATH_OF_REGISTERED_VKEY);
  const vkFound = fs.existsSync(PATH_OF_ORIGINAL_VKEY);

  if (!vkRegistered && !vkFound) {
    return res.status(400).json({ 'error': 'No verification key found' });
  }

  const { proof, publicSignals } = req.body;
  if (!proof || !publicSignals) {
    return res.status(400).json({ 'error': 'Proof or public signals is missing' });
  }
  const vkHash = vkRegistered ? (JSON.parse(fs.readFileSync(PATH_OF_REGISTERED_VKEY))).vkHash : undefined;
  const vk = vkFound ? JSON.parse(fs.readFileSync(PATH_OF_ORIGINAL_VKEY)) : undefined;

  const SUBMIT_PROOF_API_URL = `${process.env.API_BASE_URL}/submit-proof/${process.env.API_KEY}`;
  const JOB_STATUS_API_URL = `${process.env.API_BASE_URL}/job-status/${process.env.API_KEY}`;

  const submitRes = await axios.post(SUBMIT_PROOF_API_URL, {
    proofType: "groth16",
    vkRegistered,
    proofOptions: {
      library: "snarkjs",
      curve: "bn128"
    },
    proofData: {
      proof,
      publicSignals,
      vk: vkHash || vk,
    },
  });

  console.log("Proof submission result: ", submitRes.data);
  if (submitRes.data.optimisticVerify !== "success") {
    return res.status(500).json({ 'error': 'Optimistic verification failed, check the proof artifacts' });
  }

  const { jobId } = submitRes.data;
  let attempts = 0;
  for (; attempts < 20; ++attempts) {
    const jobStatusRes = await axios.get(`${JOB_STATUS_API_URL}/${jobId}`);
    console.log(jobStatusRes.data);
    const { status } = jobStatusRes.data;
    if (status === "Finalized" || status == "Aggregated") {
      console.log("Job finalized successfully");
      const attestationRes = await axios.get(`${JOB_STATUS_API_URL}/${jobId}`);
      console.log(attestationRes.data);
      return res.status(200).json({
        'verified': true,
        'txHash': attestationRes.data.txHash,
	'timestamp': attestationRes.data.updatedAt,
      });
    } else {
      console.log("Job status: ", jobStatusRes.data.status);
      console.log("Waiting for job to finalize...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  return res.status(504).json({
    'verified': false,
    'error': 'Time out for job finalizing',
  });
};

export default handler;
