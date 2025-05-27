import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';

interface GameHex {
  q: number;
  r: number;
  owner: 'northYemen' | 'uk' | 'saudi' | 'neutral';
  terrain?: 'desert' | 'mountain' | 'coast';
  name?: string; // For major cities
}

@Component({
  selector: 'app-map',
  standalone: true,
  template: `<div
    class="relative w-full bg-white rounded-lg overflow-hidden"
    style="height: 250px;"
  >
    <canvas
      #canvas
      class="w-full h-full cursor-pointer"
      (click)="onCanvasClick($event)"
    ></canvas>
  </div>`,
})
export class MapComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  hexes: GameHex[] = [
    // North Yemen territories
    { r: -4, q: -4, owner: 'northYemen' },
    { r: -4, q: -3, owner: 'northYemen' },
    { r: -4, q: -2, owner: 'northYemen' },
    { r: -4, q: -1, owner: 'northYemen' },
    { r: -4, q: 0, owner: 'northYemen' },

    { r: -3, q: -5, owner: 'northYemen' },
    { r: -3, q: -4, owner: 'northYemen' },
    { r: -3, q: -3, owner: 'northYemen' },
    { r: -3, q: -2, owner: 'northYemen' },
    { r: -3, q: -1, owner: 'northYemen' },

    { r: -2, q: -6, owner: 'northYemen' },
    { r: -2, q: -5, owner: 'northYemen' },
    { r: -2, q: -4, owner: 'northYemen', name: 'Sanaa' },
    { r: -2, q: -3, owner: 'northYemen' },
    { r: -2, q: -2, owner: 'northYemen', name: 'Marib' },

    { r: -1, q: -6, owner: 'northYemen', name: 'Hudaydah' },
    { r: -1, q: -5, owner: 'northYemen' },
    { r: -1, q: -4, owner: 'northYemen' },
    { r: -1, q: -3, owner: 'northYemen' },

    { r: 0, q: -6, owner: 'northYemen' },
    { r: 0, q: -5, owner: 'northYemen', name: 'Ibb' },

    { r: 1, q: -6, owner: 'northYemen', name: 'Taizz' },

    // UK territories
    { r: -6, q: 3, owner: 'uk' },
    { r: -6, q: 4, owner: 'uk' },
    { r: -6, q: 5, owner: 'uk' },
    { r: -6, q: 6, owner: 'uk' },
    { r: -6, q: 7, owner: 'uk' },

    { r: -5, q: 2, owner: 'uk' },
    { r: -5, q: 3, owner: 'uk' },
    { r: -5, q: 4, owner: 'uk' },
    { r: -5, q: 5, owner: 'uk' },
    { r: -5, q: 6, owner: 'uk' },
    { r: -5, q: 7, owner: 'uk' },

    { r: -4, q: 1, owner: 'uk' },
    { r: -4, q: 2, owner: 'uk' },
    { r: -4, q: 3, owner: 'uk' },
    { r: -4, q: 4, owner: 'uk' },
    { r: -4, q: 5, owner: 'uk' },
    { r: -4, q: 6, owner: 'uk' },

    { r: -3, q: 0, owner: 'uk' },
    { r: -3, q: 1, owner: 'uk' },
    { r: -3, q: 2, owner: 'uk' },
    { r: -3, q: 3, owner: 'uk' },
    { r: -3, q: 4, owner: 'uk' },
    { r: -3, q: 5, owner: 'uk' },

    { r: -2, q: -1, owner: 'uk' },
    { r: -2, q: 0, owner: 'uk' },
    { r: -2, q: 1, owner: 'uk' },
    { r: -2, q: 2, owner: 'uk' },
    { r: -2, q: 3, owner: 'uk' },
    { r: -2, q: 4, owner: 'uk' },

    { r: -1, q: -2, owner: 'uk' },
    { r: -1, q: -1, owner: 'uk' },
    { r: -1, q: 0, owner: 'uk' },
    { r: -1, q: 1, owner: 'uk' },

    { r: 0, q: -4, owner: 'uk' },
    { r: 0, q: -3, owner: 'uk' },
    { r: 0, q: -2, owner: 'uk' },
    { r: 0, q: -1, owner: 'uk' },

    { r: 1, q: -5, owner: 'uk' },
    { r: 1, q: -4, owner: 'uk' },

    { r: 2, q: -6, owner: 'uk' },
    { r: 2, q: -5, owner: 'uk', name: 'Aden' },
    { r: 2, q: 5, owner: 'uk', name: 'Socotra' },

    // Saudi territories
    { r: -8, q: -3, owner: 'saudi', name: 'Bisha' },

    { r: -7, q: -5, owner: 'saudi', name: 'Qunfudhah' },
    { r: -7, q: -4, owner: 'saudi' },
    { r: -7, q: -3, owner: 'saudi' },

    { r: -6, q: -5, owner: 'saudi' },
    { r: -6, q: -4, owner: 'saudi', name: 'Abha' },
    { r: -6, q: -3, owner: 'saudi' },

    { r: -5, q: -5, owner: 'saudi' },
    { r: -5, q: -4, owner: 'saudi' },
    { r: -5, q: -3, owner: 'saudi', name: 'Najran' },
    { r: -5, q: -2, owner: 'saudi' },

    { r: -4, q: -5, owner: 'saudi', name: 'Jazan' },
  ];

  hexSize = 14;
  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  isDragging = false;
  lastMouseX = 0;
  lastMouseY = 0;
  private backgroundImage: HTMLImageElement | null = null;

  ngAfterViewInit() {
    if (!this.canvas?.nativeElement) {
      console.error('Canvas element not found');
      return;
    }

    const canvas = this.canvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Set canvas size accounting for device pixel ratio
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;

    // Scale the canvas back down using CSS
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Scale the drawing context to match device pixel ratio
    const ctx = canvas.getContext('2d')!;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Pre-load the background image
    this.backgroundImage = new Image();
    this.backgroundImage.onload = () => {
      this.draw();
    };
    this.backgroundImage.src = '/yemen.png';
  }

  onCanvasClick(event: MouseEvent) {
    // Handle canvas click events here
    console.log('Canvas clicked at:', event.offsetX, event.offsetY);
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    this.zoom *= zoomFactor;
    this.zoom = Math.max(0.1, Math.min(5, this.zoom));
    this.draw();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const deltaX = event.clientX - this.lastMouseX;
      const deltaY = event.clientY - this.lastMouseY;

      // Calculate new offsets with bounds checking
      const newOffsetX = this.offsetX + deltaX;
      const newOffsetY = this.offsetY + deltaY;

      // Apply bounds constraints
      this.offsetX = this.constrainOffset(newOffsetX, 472, 'x');
      this.offsetY = this.constrainOffset(newOffsetY, 267, 'y');

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      this.draw();
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.isDragging = false;
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.lastMouseX = event.touches[0].clientX;
      this.lastMouseY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
      this.lastTouchDistance = this.getTouchDistance(event.touches);
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (event.touches.length === 1 && this.isDragging) {
      const deltaX = event.touches[0].clientX - this.lastMouseX;
      const deltaY = event.touches[0].clientY - this.lastMouseY;

      // Calculate new offsets with bounds checking
      const newOffsetX = this.offsetX + deltaX;
      const newOffsetY = this.offsetY + deltaY;

      // Apply bounds constraints
      this.offsetX = this.constrainOffset(newOffsetX, 472, 'x');
      this.offsetY = this.constrainOffset(newOffsetY, 267, 'y');

      this.lastMouseX = event.touches[0].clientX;
      this.lastMouseY = event.touches[0].clientY;
      this.draw();
    } else if (event.touches.length === 2) {
      event.preventDefault();
      const currentDistance = this.getTouchDistance(event.touches);
      const zoomFactor = currentDistance / this.lastTouchDistance;
      this.zoom *= zoomFactor;
      this.zoom = Math.max(0.5, Math.min(3, this.zoom));
      this.lastTouchDistance = currentDistance;
      this.draw();
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.isDragging = false;
  }

  private lastTouchDistance = 0;

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private constrainOffset(
    offset: number,
    imageSize: number,
    axis: 'x' | 'y'
  ): number {
    if (!this.canvas?.nativeElement) return offset;

    const canvasSize =
      axis === 'x'
        ? this.canvas.nativeElement.getBoundingClientRect().width
        : this.canvas.nativeElement.getBoundingClientRect().height;

    const scaledImageSize = imageSize * this.zoom;

    // If image is smaller than canvas, center it
    if (scaledImageSize <= canvasSize) {
      return (canvasSize - scaledImageSize) / 2 / this.zoom;
    }

    // If image is larger than canvas, constrain to bounds
    const maxOffset = 0; // Right/bottom edge
    const minOffset = (canvasSize - scaledImageSize) / this.zoom; // Left/top edge

    return Math.max(minOffset, Math.min(maxOffset, offset));
  }

  hexToPixel(q: number, r: number): { x: number; y: number } {
    const x =
      (290 +
        this.offsetX +
        this.hexSize * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r)) *
      this.zoom;
    const y = (192 + this.offsetY + this.hexSize * ((3 / 2) * r)) * this.zoom;
    return { x, y };
  }

  draw() {
    if (!this.canvas?.nativeElement) return;

    const ctx = this.canvas.nativeElement.getContext('2d')!;
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw background image if loaded
    if (this.backgroundImage && this.backgroundImage.complete) {
      ctx.drawImage(
        this.backgroundImage,
        this.offsetX * this.zoom,
        this.offsetY * this.zoom,
        472 * this.zoom,
        267 * this.zoom
      );
    }

    this.drawHexes(ctx);
  }

  drawHexes(ctx: CanvasRenderingContext2D) {
    const colorMap = {
      northYemen: 'rgba(0, 0, 255, 0.07)',
      uk: 'rgba(255, 0, 0, 0.07)',
      saudi: 'rgba(255, 255, 0, 0.07)',
      neutral: 'rgba(128, 128, 128, 0.2)',
    };

    this.hexes.forEach((hex) => {
      const { x, y } = this.hexToPixel(hex.q, hex.r);

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const hx = x + this.hexSize * this.zoom * Math.cos(angle);
        const hy = y + this.hexSize * this.zoom * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();

      ctx.fillStyle = colorMap[hex.owner];
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }
}
