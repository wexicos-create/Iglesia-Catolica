/**
 * Chattoj Offline Audio Synthesizer & Hardware Alert System
 * 100% Client-side Web Audio API sounds, Device Vibration & Native Push Notifications.
 * Zero external audio files required - works flawlessly in Airplane mode / 100% Offline.
 */

class OfflineAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private currentRingtoneInterval: any = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Device Vibration for Android / Mobile Devices
   */
  triggerVibration(pattern: number | number[] = [100, 50, 100]) {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Safe catch for restricted iframes or permissions
    }
  }

  /**
   * Native OS Push Notification from device
   */
  async sendNativePushNotification(title: string, body: string, icon?: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
      }

      if (Notification.permission === 'granted') {
        const notif = new Notification(title, {
          body,
          icon: icon || '/vite.svg',
          badge: icon || '/vite.svg',
          tag: 'chattoj-alert-' + Date.now(),
          vibrate: [200, 100, 200]
        } as any);

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return true;
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body, icon: icon || '/vite.svg' });
          return true;
        }
      }
    } catch {
      // Fallback
    }
    return false;
  }

  /**
   * Sent message tone: subtle high click / tick (WhatsApp style)
   */
  playSent() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Safe catch
    }
  }

  /**
   * Received message tone: gentle dual bell chime (WhatsApp style) + vibration
   */
  playReceived() {
    try {
      this.triggerVibration([80, 40, 80]);
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.14);

      // Note 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain2.gain.setValueAtTime(0.18, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.28);
    } catch {
      // AudioContext safe catch
    }
  }

  /**
   * Outgoing calling ring pulse: gentle periodic telephone ring
   */
  playCallingPulse() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(480, now + 0.1);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Safe catch
    }
  }

  /**
   * Incoming Voice Call Ringtone: Melodic, energetic cellular telephone ring
   * Dual frequency modulation (853Hz + 960Hz) with vibration rhythm
   */
  playIncomingCallRingtone() {
    try {
      this.triggerVibration([400, 200, 400, 200, 600]);
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Pulse 1
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(750, now);
      osc1.frequency.linearRampToValueAtTime(880, now + 0.35);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(950, now);
      osc2.frequency.linearRampToValueAtTime(1100, now + 0.35);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.2, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);

      // Pulse 2 (Short echo echo after 0.5s)
      const osc3 = ctx.createOscillator();
      const osc4 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(880, now + 0.55);
      osc3.frequency.linearRampToValueAtTime(1050, now + 0.9);

      osc4.type = 'sine';
      osc4.frequency.setValueAtTime(1100, now + 0.55);
      osc4.frequency.linearRampToValueAtTime(1320, now + 0.9);

      gain2.gain.setValueAtTime(0.22, now + 0.55);
      gain2.gain.setValueAtTime(0.22, now + 0.9);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.05);

      osc3.connect(gain2);
      osc4.connect(gain2);
      gain2.connect(ctx.destination);

      osc3.start(now + 0.55);
      osc4.start(now + 0.55);
      osc3.stop(now + 1.05);
      osc4.stop(now + 1.05);
    } catch {
      // Safe catch
    }
  }

  /**
   * Incoming Video Call Ringtone: Crystal harmonic digital chime
   */
  playIncomingVideoCallRingtone() {
    try {
      this.triggerVibration([300, 150, 300, 150, 300]);
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Arpeggio chords: C6 (1046Hz), E6 (1318Hz), G6 (1568Hz), C7 (2093Hz)
      const freqs = [1046.50, 1318.51, 1567.98, 2093.00];
      freqs.forEach((freq, idx) => {
        const noteStart = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.18, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      });
    } catch {
      // Safe catch
    }
  }

  /**
   * Hang up tone: low double tone
   */
  playHangup() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Safe catch
    }
  }

  /**
   * Panic alert warning beep: short urgent pulse
   */
  playPanicWarning() {
    try {
      this.triggerVibration([500, 100, 500]);
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Safe catch
    }
  }

  /**
   * Stop any looping ringtone
   */
  stopRingtoneLoop() {
    if (this.currentRingtoneInterval) {
      clearInterval(this.currentRingtoneInterval);
      this.currentRingtoneInterval = null;
    }
  }
}

export const offlineAudio = new OfflineAudioSynthesizer();
