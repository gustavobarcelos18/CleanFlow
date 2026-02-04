// Utility to play notification sound using Web Audio API
export function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create oscillator for beep sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configure sound
        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'sine';

        // Volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        // Play sound
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

    } catch (error) {
        console.error('Erro ao reproduzir som de notificação:', error);
    }
}

// Alternative: Play double beep for urgent notifications
export function playUrgentNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // First beep
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.frequency.value = 900;
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(0, audioContext.currentTime);
        gain1.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        osc1.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.2);

        // Second beep
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 900;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
        gain2.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.31);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime + 0.3);
        osc2.stop(audioContext.currentTime + 0.5);

    } catch (error) {
        console.error('Erro ao reproduzir som urgente:', error);
    }
}
