import { Component, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Platform, ToastController } from '@ionic/angular';
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
  
  // KUNCI FIXING: Variabel untuk mengunci agar menu home tidak ikut kedap-kedip
  isFeatureActive: boolean = false; 
  
  // Audio & Animation Refs
  audioContext: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  animationId: any;
  stream: MediaStream | null = null;
  sosInterval: any;
  timerTimeout: any;

  // Variabel untuk fitur Double Tap to Exit
  private lastBackPress = 0;
  private timePeriodToExit = 2000; // Toleransi jeda ketukan (2 detik)

  constructor(
    private cdr: ChangeDetectorRef, 
    private platform: Platform,
    private toastController: ToastController // Inject ToastController bawaan Ionic
  ) {
    this.platform.backButton.subscribeWithPriority(10, async () => {
      if (this.isFeatureActive || this.isLightOn) {
        // Jika ada fitur yang aktif, ketukan pertama hanya mematikan fitur tersebut
        this.stopEverything();
      } else {
        // 🎯 LOGIKA DOUBLE TAP TO EXIT
        const currentTime = new Date().getTime();
        
        if (currentTime - this.lastBackPress < this.timePeriodToExit) {
          // Jika ketukan kedua dilakukan kurang dari 2 detik, aplikasi ditutup rapat
          App.exitApp();
        } else {
          // Jika baru ketukan pertama, simpan waktu ketukan dan munculkan toast notifikasi
          this.lastBackPress = currentTime;
          await this.showExitToast();
        }
      }
    });
  }

  // --- MODE MANUAL PICKER ---
  setPreset(color: string) {
    this.stopEverything();
    this.selectedColor = color;
    this.isLightOn = true;
    this.isFeatureActive = true;
    this.cdr.detectChanges();
  }

  // --- FUNGSI MODE MUSIK / VOICE (DIOPTIMASI INSTAN & BERDETAK) ---
  async toggleVoiceMode() {
    this.stopEverything();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isVoiceMode = true;
      this.isLightOn = true;
      this.isFeatureActive = true; 
      
      this.startAudioAnalysis(this.stream);
      this.cdr.detectChanges();
    } catch (err) {
      alert('Izin Microphone diperlukan untuk mode ini!');
    }
  }

  startAudioAnalysis(stream: MediaStream) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 32; 
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
      if (!this.isVoiceMode) return; 
      this.animationId = requestAnimationFrame(draw);
      this.analyser!.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let x = 0;
      let sum = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        sum += dataArray[i];
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 4, barHeight);
        x += barWidth;
      }

      const averageVolume = sum / dataArray.length;
      const container = document.querySelector('.app-container') as HTMLElement;

      if (container) {
        if (averageVolume > 15) { 
          let intensity = averageVolume / 110; 
          
          if (intensity > 1) intensity = 1;      
          if (intensity < 0.15) intensity = 0.15; 

          container.style.opacity = `${intensity}`;
        } else {
          container.style.opacity = '0.15';
        }
      }

      this.cdr.detectChanges();
    };
    draw();
  }

  // --- FUNGSI SOS (KEDAP-KEDIP AMAN) ---
  toggleSOS() {
    this.stopEverything();
    this.isSOS = true;
    this.isLightOn = true;
    this.isFeatureActive = true; 
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
    this.isFeatureActive = true;
    this.timerTimeout = setTimeout(() => { 
      this.stopEverything(); 
    }, 10000);
    this.cdr.detectChanges();
  }

  // --- FUNGSI STOP SEMUA PROSES ---
  stopEverything() {
    this.isVoiceMode = false;
    this.isLightOn = false;
    this.isSOS = false;
    this.isFeatureActive = false; 

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

    const container = document.querySelector('.app-container') as HTMLElement;
    if (container) {
      container.style.opacity = '1';
    }

    this.cdr.detectChanges();
  }

  // --- FUNGSI TOAST NOTIFIKASI KELUAR ---
  async showExitToast() {
    const toast = await this.toastController.create({
      message: 'Ketuk sekali lagi untuk keluar',
      duration: 2000,
      position: 'bottom',
      cssClass: 'custom-exit-toast', // Class kustom yang akan kita hias di SCSS
      buttons: []
    });
    await toast.present();
  }

  ngOnDestroy() { 
    this.stopEverything(); 
  }
}