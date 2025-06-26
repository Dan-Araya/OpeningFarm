import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, User, BookOpen, Trophy, Github, Twitter, RotateCcw } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

// Hook personalizado para medir el contenedor con tipos correctos
const useContainerMeasure = <T extends HTMLElement>(): [React.RefObject<T>, { width: number; height: number }] => {
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const ref = useRef<T>(null);

  useEffect(() => {
    const updateBounds = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setBounds({ width: rect.width, height: rect.height });
      }
    };

    // Pequeño delay para asegurar que el DOM esté listo
    const timeoutId = setTimeout(updateBounds, 100);

    window.addEventListener('resize', updateBounds);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateBounds);
    };
  }, []);

  return [ref, bounds];
};

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [game, setGame] = useState(new Chess());

  const [containerRef, bounds] = useContainerMeasure<HTMLDivElement>();

  // SOLUCIÓN: Calculamos el tamaño del tablero de forma más inteligente
  const getBoardSize = () => {
    if (bounds.width <= 0) return 0;

    // En móviles pequeños, usamos casi todo el ancho disponible
    if (bounds.width < 300) {
      return Math.max(bounds.width - 20, 250); // Mínimo 250px
    }

    // En pantallas medianas y grandes, limitamos el tamaño máximo
    return Math.min(bounds.width - 20, 400); // Máximo 400px
  };

  const boardSize = getBoardSize();

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
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
                    OpeningFarm
                  </h1>
                  <p className="text-xs text-slate-400">Master Your Chess Openings</p>
                </div>
              </div>

              <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-200"
                  onClick={() => setIsLoggedIn(!isLoggedIn)}
              >
                <User className="h-4 w-4 mr-2"/>
                <span className="hidden sm:inline">{isLoggedIn ? "Profile" : "Login"}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="container mx-auto px-4 py-4 sm:py-8">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 max-w-7xl mx-auto">

            {/* Columna Izquierda: El tablero */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-2 sm:p-4 flex justify-center items-center min-h-[400px]">
                {/* CLAVE: Este contenedor se adapta al espacio disponible */}
                <div
                    ref={containerRef}
                    className="w-full flex justify-center items-center"
                    style={{ height: '100%' }}
                >
                  {boardSize > 0 && (
                      <div className="flex justify-center items-center">
                        <Chessboard
                            position={game.fen()}
                            onPieceDrop={onDrop}
                            boardWidth={boardSize}
                        />
                      </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Columna Derecha: Panel de opciones */}
            <div>
              <p className="text-center text-slate-500">Panel de Opciones (Vacío por ahora)</p>
            </div>

          </div>

          <div className="text-center mt-6">
            <p className="text-slate-400 text-sm">
            Tamaño del tablero: {boardSize}px | Ancho disponible: {bounds.width}px
            </p>
          </div>
        </main>
      </div>
  );
};

export default Index;