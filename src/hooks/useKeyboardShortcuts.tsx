import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // N - Novo ticket
      if (e.key === 'n' || e.key === 'N') {
        toast.info('Atalho: Novo Ticket (implementar modal)');
        return;
      }

      // / - Busca
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // G + T - Ir para Tickets
      if (e.key === 'g' || e.key === 'G') {
        const handleNextKey = (nextEvent: KeyboardEvent) => {
          if (nextEvent.key === 't' || nextEvent.key === 'T') {
            navigate('/admin');
            toast.success('Navegando para Tickets');
          } else if (nextEvent.key === 'c' || nextEvent.key === 'C') {
            // G + C - Ir para Chats (abre o drawer de chats)
            const chatBellButton = document.querySelector('[data-chat-bell]') as HTMLButtonElement;
            if (chatBellButton) {
              chatBellButton.click();
              toast.success('Abrindo Chats');
            }
          }
          document.removeEventListener('keydown', handleNextKey);
        };

        document.addEventListener('keydown', handleNextKey);
        
        // Remove listener after 2 seconds
        setTimeout(() => {
          document.removeEventListener('keydown', handleNextKey);
        }, 2000);
        
        return;
      }

      // ? - Mostrar atalhos
      if (e.key === '?') {
        e.preventDefault();
        toast.info(
          <div className="space-y-2">
            <p className="font-semibold">Atalhos de Teclado:</p>
            <ul className="text-sm space-y-1">
              <li><kbd>N</kbd> - Novo Ticket</li>
              <li><kbd>/</kbd> - Buscar</li>
              <li><kbd>G</kbd> + <kbd>T</kbd> - Ir para Tickets</li>
              <li><kbd>G</kbd> + <kbd>C</kbd> - Ir para Chats</li>
              <li><kbd>?</kbd> - Mostrar atalhos</li>
            </ul>
          </div>,
          { duration: 5000 }
        );
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate]);
};
