import { useEffect } from "react";
import { useSidebarStore } from "@/stores/useSidebarStore";

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export function useSidebarWidth() {
  const { width, isResizing, setWidth, setIsResizing, loadWidth, saveWidth } =
    useSidebarStore();

  useEffect(() => {
    loadWidth();
  }, []);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      saveWidth(width);
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, width]);

  return {
    width,
    isResizing,
    handleMouseDown,
    MIN_WIDTH,
    MAX_WIDTH,
  };
}
