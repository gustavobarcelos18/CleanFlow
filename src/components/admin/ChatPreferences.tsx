import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupportChat } from "@/hooks/useSupportChat";
import { Volume2, VolumeX, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const ChatPreferences = () => {
  const { soundEnabled, soundVolume, updatePreferences } = useSupportChat();
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled);
  const [localVolume, setLocalVolume] = useState(soundVolume);
  const [maxChats, setMaxChats] = useState(3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('support_agent_preferences')
        .select('*')
        .eq('agent_id', user.id)
        .maybeSingle();

      if (data) {
        setLocalSoundEnabled(data.sound_enabled);
        setLocalVolume(data.sound_volume);
        setMaxChats(data.max_concurrent_chats);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    await updatePreferences({
      sound_enabled: localSoundEnabled,
      sound_volume: localVolume,
      max_concurrent_chats: maxChats
    });
    setLoading(false);
  };

  const testSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzGM0/PKdyoFJHjH8N6RQQMTX7Tp661VFA==');
    audio.volume = localVolume / 100;
    audio.play().catch(e => console.error('Error playing test sound:', e));
  };

  return (
    <div className="space-y-6 mt-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Notificações Sonoras
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-enabled">Habilitar sons</Label>
                  <p className="text-sm text-muted-foreground">
                    Tocar som quando novo chat chegar
                  </p>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={localSoundEnabled}
                  onCheckedChange={setLocalSoundEnabled}
                />
              </div>

              {localSoundEnabled && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Volume</Label>
                      <span className="text-sm text-muted-foreground">{localVolume}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        value={[localVolume]}
                        onValueChange={([value]) => setLocalVolume(value)}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testSound}
                      className="w-full"
                    >
                      Testar Som
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Gerenciamento de Chats
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="max-chats">Máximo de chats simultâneos</Label>
              <Input
                id="max-chats"
                type="number"
                min={1}
                max={10}
                value={maxChats}
                onChange={(e) => setMaxChats(parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-muted-foreground">
                Limite de chats que você pode atender ao mesmo tempo
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
