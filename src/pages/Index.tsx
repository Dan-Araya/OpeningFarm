import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Aunque no las uses aún, las tendrás para el panel
import { Card, CardContent } from "@/components/ui/card"; // Necesario para la Card del tablero
import { Badge } from "@/components/ui/badge"; // Aunque no las uses aún, las tendrás para el panel
import { Crown, User, BookOpen, Trophy, Github, Twitter, RotateCcw } from "lucide-react"; // Iconos
import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useContainerMeasure } from '@/hooks/useContainerMeasure';
// ...
const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [game, setGame] = useState(new Chess());

  const [containerRef, bounds] = useContainerMeasure<HTMLDivElement>();
  const boardSize = Math.floor(Math.min(bounds.width, 400));

  const safeGameMutate = useCallback((modify: (g: Chess) => void) => {
    setGame((g) => {
      const updated = new Chess(g.fen());
      modify(updated);
      return updated;
    });
  }, []);

  const onDrop = useCallback((sourceSquare: string, targetSquare: string): boolean => {
    let move = null;
    safeGameMutate((g) => {
      move = g.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    });
    return move !== null;
  }, [safeGameMutate]);

  return (
      // div principal
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">

        {/* Header */}
        <header className="border-b border-slate-700/50 bg-slate-800/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-600/20 rounded-lg border border-amber-500/30">
                  <Crown className="h-6 w-6 text-amber-400"/>
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
                <User className="h-4 w-4 mr-2"/>
                {isLoggedIn ? "Profile" : "Login"}
              </Button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT - Aquí es donde estaba la omisión */}
        {/* Copiado de <main> de Index.tsx. Es crucial por las clases 'container mx-auto px-4 py-8' y 'grid' */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">

            {/* Columna Izquierda: La Card que envuelve el tablero */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4 flex justify-center">
                {/* Este es el div que ya tenías y que contiene el tablero */}
                <div ref={containerRef} className="w-full max-w-[400px] relative top-0 left-0">
                  {boardSize > 0 && (
                      <Chessboard
                          position={game.fen()}
                          onPieceDrop={onDrop}
                          boardWidth={boardSize}
                      />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Columna Derecha: Placeholder por ahora */}
            <div>
              <p className="text-center text-slate-500">Panel de Opciones (Vacío por ahora)</p>
            </div>

          </div> {/* Fin grid */}
          <p className="text-center mt-4 text-slate-400">Tablero de prueba (con Header y Main structure)</p>
        </main>

        {/* todo footer más adelante */}
      </div>
  );
};

export default Index;