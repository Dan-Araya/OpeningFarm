import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // Sigue importando Index por ahora
import TestBoard from './pages/TestBoard'; // <--- Asegúrate de importar TestBoard
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* COMENTA LA LÍNEA DE Index ASÍ: */}
            {/* <Route path="/" element={<Index />} /> */}

            {/* Y AÑADE LA RUTA PARA TU COMPONENTE DE PRUEBA ASÍ: */}
            <Route path="/" element={<TestBoard />} /> {/* Renderiza TestBoard en la ruta raíz */}

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;