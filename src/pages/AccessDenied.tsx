import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acesso Negado</CardTitle>
          <CardDescription>
            Você não possui permissão para acessar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Se você acredita que deveria ter acesso a este recurso, entre em contato com o 
            administrador do sistema.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="default" className="w-full">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">
                Ir para página inicial
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccessDenied;
