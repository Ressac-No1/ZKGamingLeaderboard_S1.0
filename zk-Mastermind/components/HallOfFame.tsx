"use client";
import {
  Stack,
  Flex,
  Text,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import React, { useState, useEffect } from 'react';
import { useGame } from "../context/GameContext";
import { FaTimes } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";

const LEADERBOARD_SIZE = 10;

const HallOfFame: React.FC = () => {
  const { gameplayEntry } = useGame();
  const [entries, setEntries] = useState<Array>([]);

  const syncLeaderboard = async (size: number) => {
    try {
      if (size <= 0)
         setEntries([]);
      else {
        const res = await fetch(`/api/leaderboard?size=${Math.floor(size)}`);
        if (res.ok) {
          const _ = await res.json();
          setEntries(Array.isArray(_) ? _ : []);
        } else {
          throw new Error("Leaderboard syncing failed");
        }
      }
    } catch (error: unknown) {
      setEntries([]);
      throw error;
    }
  };

  useEffect(() => {
    syncLeaderboard(LEADERBOARD_SIZE);
  }, []);

  useEffect(() => {
    syncLeaderboard(LEADERBOARD_SIZE);
  }, [gameplayEntry]);

  return (
    <Stack align="center" position="relative">
      <Flex direction="column">
        <Flex justify="center">
          <Text fontSize="24px">
            HALL   OF   FAME
          </Text>
        </Flex>
        <Flex justify="center">
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th isNumeric>Rank</Th>
                  <Th>Account</Th>
                  <Th isNumeric>Score</Th>
                  <Th>Proof Verified</Th>
                  <Th>Gameplay Hash</Th>
                </Tr>
              </Thead>
              <Tbody>
                {entries.map((entry, idx) => (
                  <Tr key={entry.gameplayHash}>
                    <Td isNumeric>{idx + 1}</Td>
                    <Td>{entry.account ? entry.account : "Anonym"}</Td>
                    <Td isNumeric>{entry.score}</Td>
                    {entry.verified ? 
                      <Td><Icon as={BsShieldCheck} color="#666" boxSize={6} /></Td>
                    :
                      <Td><Icon as={FaTimes} color="red.400" boxSize={5} /></Td>
                    }
                    <Td>{entry.gameplayHash}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Flex>
      </Flex>
    </Stack>
  );
};

export default HallOfFame;
