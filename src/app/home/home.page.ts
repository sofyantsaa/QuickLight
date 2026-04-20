import { Component, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Platform } from '@ionic/angular';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage implements OnDestroy {
  @ViewChild('visualizerCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  // Variabel State
  selectedColor: string = '#ffffff';
  isLightOn: boolean = false;
  isVoiceMode: boolean = false;
  isSOS: boolean = false;
  
  // Audio & Animation Refs
  audioContext: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  animationId: any;
  stream: MediaStream | null = null;
  sosInterval: any;
  timerTimeout: any;

  constructor(
    private cdr: ChangeDetectorRef, 
    private platform: Platform
  ) {
    // LOGIKA TOMBOL KEMBALI ANDROID (Hardware Back Button)
    this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.isLightOn || this.isSOS || this.isVoiceMode) {
        // Jika lampu/fitur aktif, tombol back akan mematikan fiturnya saja
        this.stopEverything();
      } else {
        // Jika aplikasi sedang standby (mati), tombol back akan menutup aplikasi
        App.exitApp();
      }
    });
  }

  // --- FUNGSI MODE MUSIK / VOICE ---
  async toggleVoiceMode() {
    this.stopEverything();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isVoiceMode = true;
      this.isLightOn = true;
      
      // Memberi jeda agar canvas Android siap render
      setTimeout(() => this.startAudioAnalysis(this.stream!), 400);
    } catch (err) {
      alert('Izin Microphone diperlukan untuk mode ini!');
    }
  }

  startAudioAnalysis(stream: MediaStream) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 64; 
    source.connect(this.analyser);
    this.drawVisualizer();
  }

  drawVisualizer() {
    if (!this.analyser || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = window.innerWidth;
    canvas.height = 250;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      this.analyser!.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let x = 0;
      let sum = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        sum += dataArray[i];
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 4, barHeight);
        x += barWidth;
      }

      // Sensitivitas deteksi suara untuk ganti warna
      if (sum / dataArray.length > 40) {
        this.selectedColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        this.cdr.detectChanges();
      }
    };
    draw();
  }

  // --- FUNGSI SOS (KEDAP-KEDIP) ---
  toggleSOS() {
    this.stopEverything();
    this.isSOS = true;
    this.isLightOn = true;
    this.selectedColor = '#ff0000';
    this.sosInterval = setInterval(() => {
      this.isLightOn = !this.isLightOn;
      this.cdr.detectChanges();
    }, 150);
  }

  // --- FUNGSI TIMER 10 DETIK ---
  activateTimer() {
    this.stopEverything();
    this.isLightOn = true;
    this.timerTimeout = setTimeout(() => { 
      this.stopEverything(); 
    }, 10000);
  }

  // --- PILIH WARNA MANUAL ---
  setPreset(color: string) {
    this.stopEverything();
    this.selectedColor = color;
    this.isLightOn = true;
  }

  // --- FUNGSI STOP SEMUA PROSES ---
  stopEverything() {
    this.isVoiceMode = false;
    this.isLightOn = false;
    this.isSOS = false;

    if (this.sosInterval) clearInterval(this.sosInterval);
    if (this.timerTimeout) clearTimeout(this.timerTimeout);
    if (this.animationId) cancelAnimationFrame(this.animationId);

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy() { 
    this.stopEverything(); 
  }
}