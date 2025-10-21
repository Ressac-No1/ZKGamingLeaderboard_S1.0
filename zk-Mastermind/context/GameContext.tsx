import { useToast } from "@chakra-ui/react";
//import { useContract } from "@thirdweb-dev/react";
import React, { useEffect, useState } from "react";

const CODE_SIZE = 4;
const NUM_ROWS = 10;
const NUM_COLORS = 8;

export const COLORS: Record<number, Record<string, string>> = {
  0: {
    name: "red",
    body: "red.400",
    border: "red.500",
  },
  1: {
    name: "orange",
    body: "orange.400",
    border: "orange.500",
  },
  2: {
    name: "yellow",
    body: "yellow.400",
    border: "yellow.500",
  },
  3: {
    name: "green",
    body: "green.400",
    border: "green.500",
  },
  4: {
    name: "cyan",
    body: "cyan.400",
    border: "cyan.500",
  },
  5: {
    name: "blue",
    body: "blue.400",
    border: "blue.500",
  },
  6: {
    name: "purple",
    body: "purple.400",
    border: "purple.500",
  },
  7: {
    name: "pink",
    body: "pink.400",
    border: "pink.500",
  },
  8: {
    name: "empty",
    body: "#111",
    border: "#333",
  },
};

type GameAction =
  | {
      type: "NEW_GAME";
    }
  | {
      type: "CHOOSE_COLOR";
      payload: {
        color: number;
      };
    }
  | {
      type: "EDIT_ROW";
      payload: {
        row: number;
        index: number;
        value: number;
      };
    }
  | {
      type: "SUBMIT_ROW";
      payload: {
        row: number;
        solution: number[];
      };
    }
  | {
      type: "SUBMIT_GAME";
      payload: {
        proof: ZKProof;
      }
    }
  | {
      type: "VERIFY_GAME";
      payload: {
        valid: boolean;
      };
    }
  | {
      type: "ADD_LOG";
      payload: Log;
    }
  | {
      type: "SET_LOADING";
      payload: {
        loading: boolean;
      };
    }
  ;

type ZKProof = {
  proof: {
    pi_a: string[3];
    pi_b: string[3][2];
    pi_c: string[3];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
  calldata: [string[2], string[2][2], string[2], string[8]];
};

type Row = {
  guess: number[];
  partial: number;
  correct: number;
  submitted: boolean;
};

type Log = {
  title: string;
  body?: string;
};

type Game = {
  board: Row[];
  focusedRow: number;
  color: number;
  started: boolean;
  solved: boolean;
  valid: boolean;
  verifiable: boolean;
  verified: boolean;
  isLoading: boolean;
  logs: Log[];
  proof?: ZKProof;
  score?: number;
};

type LeaderboardEntry = {
  account: string;
  gameInitKey: BigInt;
  localHash: string;
  score: number;
  verified: boolean;
};

type GameContextValue = {
  game: Game;
  gameInitKey: BigInt;
  accountAddr: string | null;
  setAccountAddr: React.Dispatch<React.SetStateAction<string | null>>;
  gameplayEntry: LeaderboardEntry | null;
  dispatch: React.Dispatch<GameAction>;
  newGame: () => void;
  submitRow: (row: number) => void;
  submitGame: () => void;
  verify: () => void;
};

interface TxInfo {
  domainId?: number;
  aggregationId?: number;
  blockHash?: string;
  txHash?: string;
  statement?: string | null;
  status: string;
}

const GameContext = React.createContext<GameContextValue>(
  {} as GameContextValue
);

export function useGame() {
  return React.useContext(GameContext);
}

const generateEmptyGame = () => ({
  board: Array.from(Array(NUM_ROWS).keys()).map(() => ({
    guess: Array(CODE_SIZE).fill(NUM_COLORS),
    partial: 0,
    correct: 0,
    submitted: false,
  })),
  color: 0,
  started: false,
  solved: false,
  valid: false,
  verifiable: false,
  verified: false,
  isLoading: false,
  logs: [],
  focusedRow: -1,
});

const gameReducer = (state: Game, action: GameAction) => {
  const updatedState: Game = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    case "NEW_GAME":
      const game: Game = JSON.parse(JSON.stringify(generateEmptyGame()));
      game.started = true;
      game.proof = undefined;
      game.score = undefined;
      return game;
    case "CHOOSE_COLOR":
      updatedState.color = action.payload.color;
      return updatedState;
    case "EDIT_ROW":
      updatedState.board[action.payload.row].guess[action.payload.index] = state.color;
      updatedState.focusedRow = action.payload.row;
      return updatedState;
    case "SUBMIT_ROW":
      updatedState.board[action.payload.row].correct = parseInt(action.payload.correct);
      updatedState.board[action.payload.row].partial = parseInt(action.payload.partial);
      updatedState.board[action.payload.row].submitted = true;
      if (updatedState.board[action.payload.row].correct === CODE_SIZE) {
        updatedState.solved = true;
      }
      updatedState.focusedRow = -1;
      return updatedState;
    case "SUBMIT_GAME":
      updatedState.proof = action.payload.proof;
      updatedState.score = parseInt(action.payload.proof.publicSignals[0]);
      updatedState.focusedRow = -1;
      return updatedState;
    case "SUBMISSION_DONE":
      updatedState.verifiable = action.payload.verifiable;
      return updatedState;
    case "VERIFY_GAME":
      updatedState.verified = true;
      updatedState.valid = action.payload.valid;
      updatedState.focusedRow = -1;
      return updatedState;
    case "ADD_LOG":
      updatedState.logs.push(action.payload);
      return updatedState;
    case "SET_LOADING":
      updatedState.isLoading = action.payload.loading;
      return updatedState;
  }
};

const GameProvider: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const toast = useToast();
  /*const { contract } = useContract(
    process.env.NEXT_PUBLIC_VERIFYING_CONTRACT_ADDRESS
  );*/
  const [game, dispatch] = React.useReducer(
    gameReducer,
    JSON.parse(JSON.stringify(generateEmptyGame()))
  );

  const [ accountAddr, setAccountAddr ] = useState<string | null>(null);
  const [ gameInitKey, setGameInitKey ] = useState<BigInt | null>(null); 
  const [ gameplayEntry, setGameplayEntry ] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (game.solved)
      toast({
        title: "Congratulations, you broke the code!",
        status: "success",
      });
  }, [game.solved, toast]);

  async function newGame() {
    try {
      const res = await fetch("/api/gameInit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountAddr: accountAddr || "0x0",
        }),
      });

      const data = await res.json();
      setGameInitKey(BigInt(data.initKey));
    
      dispatch({
        type: "NEW_GAME",
      });

      dispatch({
        type: "ADD_LOG",
        payload: {
          title: `New game initialized, with initialization key ${data.initKey}`,
        },
      });
 
      setGameplayEntry(null);
    } catch (error: unknown) {
      dispatch({
        type: "ADD_LOG",
        payload: {
          title: `New game initialization failed: ${(error as Error).message}`,
        },
      });
    }
  }

  async function submitRow(row: number) {
    const res = await fetch(`/api/guessRow?initKey=${gameInitKey.toString()}&guess=[${game.board[row].guess.toString()}]`);
    if (res.ok) {
      const data = await res.json();
      const { correct, partial } = data;
      const guessText = game.board[row].guess
        .map((color: number) => COLORS[color].name)
        .join(", ");

      dispatch({
        type: "ADD_LOG",
        payload: {
          title: `Sending guess ${
            row + 1
          } [${guessText}] to be checked by the code maker`,
        },
      });

      dispatch({
        type: "SUBMIT_ROW",
        payload: {
          row,
          correct,
          partial,
        },
      });
    } else {
      dispatch({
        type: "ADD_LOG",
        payload: {
          title: `Failed to fetch the solution from server, please try again to send the guess ${row + 1}`,
        },
      }); 
    }
  }

  async function submitGame() {
    dispatch({
      type: "SET_LOADING",
      payload: {
        loading: true,
      },
    });

    const guessData = {
      guess: game.board.map((thisRow: Row) => thisRow.guess).reduce((_, __) => _.concat(__), []),
      numPartial: game.board.map((thisRow: Row) => thisRow.partial),
      numCorrect: game.board.map((thisRow: Row) => thisRow.correct),
    };
    
    try {
      const res = await fetch("/api/proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guessData,
          initKey: gameInitKey.toString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();

        dispatch({
          type: "SUBMIT_GAME",
          payload: {
            proof: data,
          }
        });

        dispatch({
          type: "ADD_LOG",
          payload: {
            title: `Received zkSNARK proof from the code maker of the game, with a score of ${data.publicSignals[0]}`,
            body: `${JSON.stringify(data.proof)}`
          },
        });
      } else {
        dispatch({
          type: "ADD_LOG",
          payload: {
            title: 'Failed in zkSNARK proof generation of this game, maybe due to the broken guess data',
          },
        });
      }

      dispatch({
        type: "SUBMISSION_DONE",
        payload: {
          verifiable: true,
        },
      });
    } catch (error: unknown) {
      dispatch({
        type: "ADD_LOG",
        payload: {
          title: `Error in zkSNARK proof generation of this game: ${(error as Error).message}`,
        },
      });

      dispatch({
        type: "SUBMISSION_DONE",
        payload: {
          verifiable: false,
        },
      });
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: {
          loading: false,
        },
      });
    }
  }

  async function verify() {
    const proof = game.proof;

    dispatch({
      type: "ADD_LOG",
      payload: {
        title: `Verifying proof of gameplay ${gameInitKey.toString()}, authenticated by local hash ${proof.publicSignals[1]}`,
      },
    });

    dispatch({
      type: "SET_LOADING",
      payload: {
        loading: true,
      },
    });

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proof: proof.proof,
          publicSignals: proof.publicSignals,
        }),
      });

      const data = await res.json();
      const valid = !!(data.verified);
      
      dispatch({
        type: "VERIFY_GAME",
        payload: {
          valid: valid,
        },
      });

      dispatch({
        type: "ADD_LOG",
        payload: {
          title: valid
            ? `Proof successfully verified by contract at time ${data.timestamp}! Tx hash: ${data.txHash}`
            : (data.error
              ? `Contract rejected to verify the proof! Error: ${data.error}`
              : 'Contract rejected to verify the proof!'
            )
        },
      });

      dispatch({
        type: "SET_LOADING",
        payload: {
          loading: false,
        },
      });

      setGameplayEntry({
        account: accountAddr,
        gameInitKey,
        localHash: proof.publicSignals[1],
        score: game.score,
        verified: valid,
      });
    } catch (error: unknown) {
      dispatch({
        type: "ADD_LOG",
        payload: {
          title: `Error in proof verification process: ${(error as Error).message}`,
        },
      });
      
      dispatch({
        type: "VERIFY_GAME",
        payload: {
          valid: false,
        },
      });

      dispatch({
        type: "SET_LOADING",
        payload: {
          loading: false,
        },
      });
    }
  }

  return (
    <GameContext.Provider value={{ game, dispatch, accountAddr, setAccountAddr, gameplayEntry, gameInitKey, newGame, submitRow, submitGame, verify }}>
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;
