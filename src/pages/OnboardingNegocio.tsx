import { useNavigate } from 'react-router-dom';
import OnboardingSegmento from '@/components/onboarding/OnboardingSegmento';

export default function OnboardingNegocio() {
  const navigate = useNavigate();

  return (
    <OnboardingSegmento 
      onComplete={() => navigate('/')}
      onBack={() => navigate(-1)}
    />
  );
}
