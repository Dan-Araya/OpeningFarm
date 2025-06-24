import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, User, BookOpen, Trophy, Github, Twitter, RotateCcw } from "lucide-react";
import { Chess } from "chess.js"
import { Chessboard } from "react-chessboard";
import { useState, useEffect, useCallback, useRef } from "react"; // Added useRef

// Define the structure for chess openings
interface ChessOpening {
  id: string;
  name: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  moves: string; // PGN-like string of moves, e.g., "1.e4 c5 2.Nf3 d6"
}

// Define the structure for an active practice session
interface PracticeSession {
  openingId: string;
  openingName: string;
  openingMoves: string[]; // Array of individual move SANs, e.g., ['e4', 'c5', 'Nf3', 'd6']
  currentMoveIndex: number; // Index of the next expected move in openingMoves
  status: 'idle' | 'in-progress' | 'completed' | 'failed';
}

const chessOpenings: ChessOpening[] = [
  { id: "sicilian-najdorf", name: "Sicilian Najdorf", difficulty: "Advanced", moves: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6" },
  { id: "scotch-gambit", name: "Scotch Gambit", difficulty: "Intermediate", moves: "1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Bc4" },
  { id: "queens-gambit", name: "Queen's Gambit", difficulty: "Beginner", moves: "1.d4 d5 2.c4" },
  { id: "kings-indian", name: "King's Indian Defense", difficulty: "Advanced", moves: "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7" },
  { id: "french-defense", name: "French Defense", difficulty: "Intermediate", moves: "1.e4 e6" },
  { id: "caro-kann", name: "Caro-Kann Defense", difficulty: "Intermediate", moves: "1.e4 c6" },
  { id: "english-opening", name: "English Opening", difficulty: "Beginner", moves: "1.c4" },
  { id: "ruy-lopez", name: "Ruy López", difficulty: "Intermediate", moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5" },
];

// Helper function to get difficulty color classes for Tailwind CSS
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Beginner": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "Intermediate": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "Advanced": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

// Helper function to parse PGN-like opening moves into an array of SAN strings
const parseOpeningMoves = (movesString: string): string[] => {
  // Regex to remove move numbers (e.g., "1.", "2.") and capture moves
  // This will split "1.e4 e5 2.Nf3 Nc6" into ["e4", "e5", "Nf3", "Nc6"]
  return movesString.split(/\d+\./).map(s => s.trim()).filter(Boolean).flatMap(s => s.split(/\s+/).filter(Boolean));
};

// Custom useMeasure hook to replace @react-hookz/web
const useContainerMeasure = <T extends HTMLElement = HTMLDivElement>() => {
  const ref = useRef<T>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      // We are only interested in the first entry, which is the element itself
      const { width, height } = entries[0].contentRect;
      setBounds({ width, height });
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return [ref, bounds] as const;
};


const Index = () => {
  // State for the Chess.js game instance
  const [game, setGame] = useState(new Chess());
  // State for the currently selected opening from the dropdown
  const [selectedOpeningId, setSelectedOpeningId] = useState<string>("");
  // State to track the active practice session
  const [practiceSession, setPracticeSession] = useState<PracticeSession | null>(null);
  // State for user feedback messages during practice
  const [practiceMessage, setPracticeMessage] = useState<string>("");
  // State to simulate login status (for UI purposes)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // useContainerMeasure hook to get the size of the container for responsive chessboard sizing
  const [containerRef, bounds] = useContainerMeasure<HTMLDivElement>();
  // Calculate board size, capping it at 400px for smaller screens
  const boardSize = Math.floor(Math.min(bounds.width, 400)); // Usamos 'boardSize' de nuevo para claridad
  // Key to force re-render of Chessboard when its size changes
  // const [boardKey, setBoardKey] = useState(0);

  // Effect to update boardKey when container width changes, ensuring responsiveness
  //useEffect(() => {
  //  if (bounds.width > 0) {
  //    setBoardKey((k) => k + 1);
  //  }
  //}, [bounds.width]);

  // Helper function to safely mutate the Chess.js game state (creates a new instance)
  const safeGameMutate = useCallback((modify: (g: Chess) => void) => {
    setGame((g) => {
      const updated = new Chess(g.fen()); // Create a new Chess instance from current FEN
      modify(updated); // Apply the modification to the new instance
      return updated; // Return the updated instance
    });
  }, []); // No dependencies as it operates on the previous game state

  // Function called when a piece is dropped on the chessboard
  const onDrop = useCallback((sourceSquare: string, targetSquare: string): boolean => {
    // If no practice session is active, allow any valid move (free play)
    if (!practiceSession) {
      let move = null;
      safeGameMutate((g) => {
        move = g.move({ from: sourceSquare, to: targetSquare, promotion: "q" }); // Default to queen promotion
      });
      return move !== null; // Return true only if the move was valid
    }

    // --- Practice Session Logic ---
    const { openingMoves, currentMoveIndex, status } = practiceSession;

    // Do not allow moves if practice is completed or failed
    if (status === 'completed' || status === 'failed') {
      setPracticeMessage("Practice session ended. Please reset to try again.");
      return false; // Do not allow moves if session is over
    }

    const expectedMove = openingMoves[currentMoveIndex];
    let userMoveResult = null;

    // Create a temporary game instance to validate the user's attempted move
    const tempGame = new Chess(game.fen());
    try {
      userMoveResult = tempGame.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    } catch (e) {
      // Chess.js throws an error for illegal moves, etc.
      setPracticeMessage("Invalid move. Try again.");
      return false; // The piece should snap back
    }

    if (!userMoveResult) { // This check might be redundant if try/catch handles all failures
      setPracticeMessage("Invalid move. Try again.");
      return false; // The piece should snap back
    }

    // Check if the user's move matches the expected move in SAN format
    if (userMoveResult.san === expectedMove) {
      setPracticeMessage("Correct move!");
      // Apply the user's move to the actual game state
      safeGameMutate((g) => {
        g.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      });

      // Update practice session state to reflect user's correct move
      const nextMoveIndexAfterUser = currentMoveIndex + 1;
      setPracticeSession(prev => prev ? { ...prev, currentMoveIndex: nextMoveIndexAfterUser } : null);

      // If opening is completed after user's move
      if (nextMoveIndexAfterUser >= openingMoves.length) {
        setPracticeSession(prev => prev ? { ...prev, status: 'completed' } : null);
        setPracticeMessage("Congratulations! You completed the opening!");
        return true; // Indicate user's final move was successful
      }

      // It's the computer's turn to play the next move in the opening
      // Use a setTimeout to allow React to render the user's move first
      setTimeout(() => {
        setGame(currentG => { // Use functional update to get the latest state after user's move
          const gameAfterUserMove = new Chess(currentG.fen()); // Ensure we work off the latest state
          const computerMoveSan = openingMoves[nextMoveIndexAfterUser];
          const possibleComputerMoves = gameAfterUserMove.moves({ verbose: true });
          const computerMove = possibleComputerMoves.find(move => move.san === computerMoveSan);

          if (computerMove) {
            gameAfterUserMove.move(computerMove);
            const nextMoveIndexAfterComputer = nextMoveIndexAfterUser + 1;
            setPracticeSession(prev => prev ? { ...prev, currentMoveIndex: nextMoveIndexAfterComputer } : null);

            if (nextMoveIndexAfterComputer >= openingMoves.length) {
              setPracticeSession(prev => prev ? { ...prev, status: 'completed' } : null);
              setPracticeMessage("Congratulations! You completed the opening!");
            } else {
              setPracticeMessage(`Make your next move: ${openingMoves[nextMoveIndexAfterComputer]}`);
            }
          } else {
            // This should theoretically not happen if `openingMoves` are valid
            setPracticeMessage("Error: Computer could not make expected move. Resetting practice.");
            setPracticeSession(prev => prev ? { ...prev, status: 'failed' } : null);
            gameAfterUserMove.reset(); // Reset board if an unexpected error occurs
          }
          return gameAfterUserMove; // Return the new game state after computer's move
        });
      }, 300); // Small delay for visual clarity (300ms)

      return true; // User's move was correct and accepted
    } else {
      // User made an incorrect move
      setPracticeMessage(`Incorrect move. Expected ${expectedMove}. Try again.`);
      return false; // The piece should snap back to its original square
    }
  }, [practiceSession, game, safeGameMutate]);


  // Find the selected opening data based on selectedOpeningId
  const selectedOpeningData = chessOpenings.find(op => op.id === selectedOpeningId);

  // Handle starting a practice session
  const handleStartPractice = () => {
    if (selectedOpeningData) {
      // Reset the game board
      safeGameMutate((g) => g.reset());
      setPracticeMessage(`Starting practice for: ${selectedOpeningData.name}`);

      // Parse moves and initialize practice session state
      const parsedMoves = parseOpeningMoves(selectedOpeningData.moves);
      setPracticeSession({
        openingId: selectedOpeningData.id,
        openingName: selectedOpeningData.name,
        openingMoves: parsedMoves,
        currentMoveIndex: 0,
        status: 'in-progress',
      });

      // Display the first expected move prompt
      if (parsedMoves.length > 0) {
        setPracticeMessage(`Make the first move: ${parsedMoves[0]}`);
      }
    } else {
      setPracticeMessage("Please select an opening to start practice.");
    }
  };

  // Handle resetting the current practice session
  const handleResetPractice = () => {
    setGame(new Chess()); // Reset the game board to initial position
    setPracticeSession(null); // Clear the practice session state
    setPracticeMessage(""); // Clear any practice messages
    setSelectedOpeningId(""); // Reset the selected opening in the dropdown
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Header */}
        <header className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-600/20 rounded-lg border border-amber-500/30">
                  <Crown className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
                    OpeningFarm
                  </h1>
                  <p className="text-xs text-slate-400">Master Your Chess Openings</p>
                </div>
              </div>

              <Button
                  variant="outline"
                  className="border-slate-600 bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-200"
                  onClick={() => setIsLoggedIn(!isLoggedIn)}
              >
                <User className="h-4 w-4 mr-2" />
                {isLoggedIn ? "Profile" : "Login"}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">

            {/* Chessboard Section */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-4 flex justify-center">
                {/* ¡ESTO ES CRUCIAL! Vuelve a poner ref={containerRef} en el div que deseas medir. */}
                {/* También, vuelve a usar tu className original. El style={} de prueba ya no es necesario aquí. */}
                <div ref={containerRef} className="w-full max-w-[400px] relative top-0 left-0">
                  {/* ¡Vuelve a poner la condición boardSize > 0 && ! */}
                  {boardSize > 0 && (
                      <Chessboard
                          // key={boardKey} // Asegúrate de que esta línea siga comentada o eliminada
                          position={game.fen()}
                          onPieceDrop={onDrop}
                          boardWidth={boardSize} // Usa boardSize (el renombrado fixedBoardSize)
                      />
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Opening Selection Panel */}
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <BookOpen className="h-5 w-5 text-amber-400"/>
                    <h2 className="text-xl font-semibold">Select Opening</h2>
                  </div>

                  <div className="space-y-4">
                    <Select value={selectedOpeningId} onValueChange={setSelectedOpeningId}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Choose a chess opening to practice"/>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {chessOpenings.map((opening) => (
                            <SelectItem key={opening.id} value={opening.id} className="text-white hover:bg-slate-700">
                              <div className="flex items-center justify-between w-full">
                                <span>{opening.name}</span>
                                <Badge className={`ml-2 ${getDifficultyColor(opening.difficulty)} border`}>
                                  {opening.difficulty}
                                </Badge>
                              </div>
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedOpeningData && (
                        <Card className="bg-slate-700/30 border-slate-600/50">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-amber-300">{selectedOpeningData.name}</h3>
                                <Badge className={`${getDifficultyColor(selectedOpeningData.difficulty)} border`}>
                                  {selectedOpeningData.difficulty}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-sm text-slate-300 mb-2">Opening moves:</p>
                                <code
                                    className="text-xs bg-slate-800/50 px-3 py-2 rounded border border-slate-600/50 block font-mono text-amber-200">
                                  {selectedOpeningData.moves}
                                </code>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    )}

                    <Button
                        onClick={handleStartPractice}
                        disabled={!selectedOpeningId || practiceSession?.status === 'in-progress'}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trophy className="h-4 w-4 mr-2"/>
                      Start Practice Session
                    </Button>

                    {/* Practice Feedback Area */}
                    {practiceSession && (
                        <div className="flex flex-col space-y-2 mt-4">
                          {practiceMessage && (
                              <p className={`text-center py-2 px-4 rounded-md font-semibold
                            ${practiceMessage.includes("Correct") ? "bg-green-500/20 text-green-300 border border-green-500/30" :
                                  practiceMessage.includes("Incorrect") || practiceMessage.includes("Error") ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                                      "bg-slate-700/30 text-slate-300 border border-slate-600/50"}
                            `}>
                                {practiceMessage}
                              </p>
                          )}
                          {(practiceSession.status === 'completed' || practiceSession.status === 'failed') && (
                              <Button
                                  onClick={handleResetPractice}
                                  className="w-full bg-slate-700/50 hover:bg-slate-600/50 text-white font-semibold py-3 transition-all duration-200"
                              >
                                <RotateCcw className="h-4 w-4 mr-2"/>
                                Reset Practice
                              </Button>
                          )}
                        </div>
                    )}

                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-amber-300">Your Progress</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">12</p>
                      <p className="text-xs text-slate-400">Openings Learned</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">87%</p>
                      <p className="text-xs text-slate-400">Success Rate</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">245</p>
                      <p className="text-xs text-slate-400">Practice Games</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-700/50 bg-slate-800/30 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Crown className="h-5 w-5 text-amber-400"/>
                  <span className="font-semibold text-amber-300">OpeningFarm</span>
                </div>
                <p className="text-sm text-slate-400">
                  Master chess openings with structured practice and analysis.
                  Built for players who want to improve their opening repertoire.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-white">Resources</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Opening Database</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Practice Statistics</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Learning Path</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Community</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-white">Connect</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-slate-400 hover:text-amber-400 transition-colors">
                    <Github className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-amber-400 transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Ready for Lichess API integration
                </p>
              </div>
            </div>

            <div className="border-t border-slate-700/50 mt-8 pt-6 text-center">
              <p className="text-sm text-slate-400">
                © 2024 OpeningFarm. Built with React + Vite. Ready for chess mastery.
              </p>
            </div>
          </div>
        </footer>
      </div>
  );
};

export default Index;
