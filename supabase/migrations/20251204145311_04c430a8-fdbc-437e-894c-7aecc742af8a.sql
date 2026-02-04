-- Create system_configs table for storing integration credentials
CREATE TABLE IF NOT EXISTS public.system_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  is_secret BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- Only master users can manage system configs
CREATE POLICY "Master can manage system configs"
ON public.system_configs
FOR ALL
USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master'::system_role);

-- Support users can view non-secret configs
CREATE POLICY "Support can view non-secret configs"
ON public.system_configs
FOR SELECT
USING (has_support_access(auth.uid()) AND is_secret = false);

-- Trigger for updated_at
CREATE TRIGGER update_system_configs_updated_at
  BEFORE UPDATE ON public.system_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default webhook verify token
INSERT INTO public.system_configs (key, value, is_secret, description)
VALUES 
  ('meta_api_version', 'v18.0', false, 'Versão da API Meta WhatsApp'),
  ('stripe_test_mode', 'true', false, 'Modo de teste do Stripe')
ON CONFLICT (key) DO NOTHING;