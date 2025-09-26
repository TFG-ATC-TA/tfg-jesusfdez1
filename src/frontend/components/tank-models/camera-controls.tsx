import { Maximize, Minimize, ArrowUpFromLine, Square, PanelLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CameraControlButtonsProps {
  handleViewChange: (view: string) => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  mode?: 'realtime' | 'historical';
}

const CameraControlButtons = ({ 
  handleViewChange, 
  toggleFullscreen, 
  isFullscreen,
  mode = 'realtime'
}: CameraControlButtonsProps) => {
  const [currentView, setCurrentView] = useState("default");

  const toggleView = (view: string) => {
    if (currentView === view) {
      setCurrentView("default");
      handleViewChange("default");
    } else {
      setCurrentView(view);
      handleViewChange(view);
    }
  };

  return (
    <div className="absolute bottom-3 right-3 z-50 flex flex-col gap-2 sm:flex-row">
      <TooltipProvider>
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md p-1.5 flex flex-row sm:flex-row gap-1.5 border border-gray-200 dark:border-gray-700">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === "lateral" ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 ${
                  currentView === "lateral" 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => toggleView("lateral")}
              >
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Vista Lateral</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Vista Lateral</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === "front" ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 ${
                  currentView === "front" 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => toggleView("front")}
              >
                <Square className="h-4 w-4" />
                <span className="sr-only">Vista Frontal</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Vista Frontal</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === "top" ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 ${
                  currentView === "top" 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => toggleView("top")}
              >
                <ArrowUpFromLine className="h-4 w-4" />
                <span className="sr-only">Vista Zenital</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Vista Zenital</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                <span className="sr-only">{isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default CameraControlButtons;
