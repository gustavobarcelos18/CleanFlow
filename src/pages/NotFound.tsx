import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="p-4 bg-primary-light rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <span className="text-4xl font-bold text-primary">404</span>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-foreground">Página não encontrada</h1>
        <p className="mb-6 text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <a 
          href="/" 
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
        >
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
