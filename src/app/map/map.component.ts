import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';

interface Hex {
  q: number;
  r: number;
}

interface HexTerritories {
  northYemen: Hex[];
  uk: Hex[];
  saudi: Hex[];
}

@Component({
  selector: 'app-map',
  standalone: true,
  template:
    '<canvas #canvas width="560" height="480" class="w-full h-full rounded-2xl border border-black"></canvas>',
})
export class MapComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  hexes: HexTerritories = {
    northYemen: [
      { r: -4, q: -4 },
      { r: -4, q: -3 },
      { r: -4, q: -2 },
      { r: -4, q: -1 },
      { r: -4, q: 0 },

      { r: -3, q: -5 },
      { r: -3, q: -4 },
      { r: -3, q: -3 },
      { r: -3, q: -2 },
      { r: -3, q: -1 },

      { r: -2, q: -5 },
      { r: -2, q: -4 }, // Sanaa
      { r: -2, q: -3 },
      { r: -2, q: -2 }, // Marib

      { r: -1, q: -6 }, // Hudaydah
      { r: -1, q: -5 },
      { r: -1, q: -4 },
      { r: -1, q: -3 },

      { r: 0, q: -6 },
      { r: 0, q: -5 }, // Ibb

      { r: 1, q: -6 }, // Taizz
    ],
    uk: [
      { r: -6, q: 3 },
      { r: -6, q: 4 },
      { r: -6, q: 5 },
      { r: -6, q: 6 },
      { r: -6, q: 7 },

      { r: -5, q: 2 },
      { r: -5, q: 3 },
      { r: -5, q: 4 },
      { r: -5, q: 5 },
      { r: -5, q: 6 },
      { r: -5, q: 7 },

      { r: -4, q: 1 },
      { r: -4, q: 2 },
      { r: -4, q: 3 },
      { r: -4, q: 4 },
      { r: -4, q: 5 },
      { r: -4, q: 6 },

      { r: -3, q: 0 },
      { r: -3, q: 1 },
      { r: -3, q: 2 },
      { r: -3, q: 3 },
      { r: -3, q: 4 },
      { r: -3, q: 5 },

      { r: -2, q: -1 },
      { r: -2, q: 0 },
      { r: -2, q: 1 },
      { r: -2, q: 2 },
      { r: -2, q: 3 },
      { r: -2, q: 4 },

      { r: -1, q: -2 },
      { r: -1, q: -1 },
      { r: -1, q: 0 },
      { r: -1, q: 1 },

      { r: 0, q: -4 },
      { r: 0, q: -3 },
      { r: 0, q: -2 },
      { r: 0, q: -1 },

      { r: 1, q: -5 },
      { r: 1, q: -4 },

      { r: 2, q: -6 },
      { r: 2, q: -5 }, // Aden
    ],
    saudi: [
      { r: -8, q: -3 }, // Bisha

      { r: -7, q: -5 }, // Qunfudhah
      { r: -7, q: -4 },
      { r: -7, q: -3 },

      { r: -6, q: -5 },
      { r: -6, q: -4 }, // Abha
      { r: -6, q: -3 },

      { r: -5, q: -5 },
      { r: -5, q: -4 },
      { r: -5, q: -3 }, // Najran
      { r: -5, q: -2 },

      { r: -4, q: -5 }, // Jazan
    ],
  };
  hexSize = 14;
  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  isDragging = false;
  lastMouseX = 0;
  lastMouseY = 0;

  ngAfterViewInit() {
    const canvas = this.canvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    this.draw();
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
      this.offsetX += deltaX;
      this.offsetY += deltaY;
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
      this.offsetX += deltaX;
      this.offsetY += deltaY;
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
    const ctx = this.canvas.nativeElement.getContext('2d')!;
    ctx.clearRect(0, 0, 560, 360);

    // Draw background image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(
        img,
        this.offsetX * this.zoom,
        this.offsetY * this.zoom,
        472 * this.zoom,
        267 * this.zoom
      );
      this.drawHexes(ctx);
    };
    img.src = '/yemen.png';
  }

  drawHexes(ctx: CanvasRenderingContext2D) {
    // Draw hex fills and outlines
    this.drawTerritoryHexes(ctx, this.hexes.northYemen, 'rgba(0, 0, 255, 0.2)');
    this.drawTerritoryHexes(ctx, this.hexes.uk, 'rgba(255, 0, 0, 0.2)');
    this.drawTerritoryHexes(ctx, this.hexes.saudi, 'rgba(255, 255, 0, 0.2)');
  }

  drawTerritoryHexes(
    ctx: CanvasRenderingContext2D,
    territory: Hex[],
    fillColor: string
  ) {
    territory.forEach((hex) => {
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

      // Fill with territory color
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Stroke with black outline
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }
}
