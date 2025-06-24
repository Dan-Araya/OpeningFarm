// frontend/src/pages/TestBoard.tsx

import { useState, useCallback, useRef, useEffect } from 'react'; // Necesitamos useEffect y useRef para useContainerMeasure
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useContainerMeasure } from '@/hooks/useContainerMeasure'; // Ajusta la ruta si es diferente

const TestBoard = () => {
    const [game, setGame] = useState(new Chess());

    // Mantén tu useContainerMeasure para probar el redimensionamiento responsivo con Math.floor
    const [containerRef, bounds] = useContainerMeasure<HTMLDivElement>();
    const boardSize = Math.floor(Math.min(bounds.width, 400)); // Mantén la lógica del tamaño entero

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
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
            {/* Contenedor del tablero, con ref para medir y con ancho máximo */}
            {/* Usamos un div simple sin componentes Card ni otros estilos complejos */}
            <div ref={containerRef} className="w-full max-w-[400px]" style={{ position: 'relative' }}>
                {boardSize > 0 && ( // Condición para renderizar solo si el tamaño es válido
                    <Chessboard
                        position={game.fen()}
                        onPieceDrop={onDrop}
                        boardWidth={boardSize} // Aquí pasamos el boardSize calculado
                        // NO USES 'key={boardKey}' AQUÍ TAMPOCO
                    />
                )}
                {/* Un pequeño mensaje para confirmar que estás en la página de prueba */}
                <p className="text-center mt-4">Tablero de prueba</p>
            </div>
        </div>
    );
};

export default TestBoard;