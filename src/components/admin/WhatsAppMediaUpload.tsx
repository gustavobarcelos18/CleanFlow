import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, File, Image, FileText } from "lucide-react";

interface WhatsAppMediaUploadProps {
  conversationId: string;
  onMediaUploaded: (mediaUrl: string, mediaType: string) => void;
}

export function WhatsAppMediaUpload({
  conversationId,
  onMediaUploaded,
}: WhatsAppMediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 16MB para WhatsApp)
    if (file.size > 16 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 16MB");
      return;
    }

    // Validar tipo
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado");
      return;
    }

    setFileName(file.name);
    setFileType(file.type);

    // Preview para imagens
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Gerar nome único
      const fileExt = file.name.split(".").pop();
      const fileName = `${conversationId}/${Date.now()}.${fileExt}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("whatsapp-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("whatsapp-media")
        .getPublicUrl(fileName);

      onMediaUploaded(publicUrl, file.type);
      toast.success("Arquivo enviado com sucesso");
      
      // Limpar preview
      setTimeout(() => {
        setPreview(null);
        setFileName(null);
        setFileType(null);
      }, 2000);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setFileName(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    if (!fileType) return <File className="h-8 w-8" />;
    if (fileType.startsWith("image/")) return <Image className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx"
      />

      {preview || fileName ? (
        <Card className="p-4 mb-2">
          <div className="flex items-center gap-3">
            {preview ? (
              <img src={preview} alt="Preview" className="h-16 w-16 object-cover rounded" />
            ) : (
              <div className="h-16 w-16 flex items-center justify-center bg-muted rounded">
                {getFileIcon()}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{fileName}</p>
              {uploading && <p className="text-xs text-muted-foreground">Enviando...</p>}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={clearPreview}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
