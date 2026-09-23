import { Component, input } from '@angular/core';
import { ArtifactGlyph as GlyphKind } from '../../core/models/portfolio.models';

/** Hand-drawn SVG mark for each project, used instead of screenshots. */
@Component({
  selector: 'app-artifact-glyph',
  template: `
    <svg viewBox="0 0 160 100" aria-hidden="true" [class]="kind()">
      @switch (kind()) {
        @case ('pipeline') {
          <path class="edge" d="M26 50 C 50 50, 50 26, 74 26 M26 50 C 50 50, 50 74, 74 74 M86 26 C 110 26, 110 50, 134 50 M86 74 C 110 74, 110 50, 134 50" />
          <circle class="node" cx="20" cy="50" r="7" />
          <rect class="node accent" x="72" y="19" width="16" height="14" rx="3" />
          <rect class="node" x="72" y="67" width="16" height="14" rx="3" />
          <circle class="node accent" cx="140" cy="50" r="7" />
          <circle class="packet" r="2.5"><animateMotion dur="2.6s" repeatCount="indefinite" path="M26 50 C 50 50, 50 26, 74 26" /></circle>
          <circle class="packet" r="2.5"><animateMotion dur="2.6s" begin="1.3s" repeatCount="indefinite" path="M86 74 C 110 74, 110 50, 134 50" /></circle>
        }
        @case ('dashboard') {
          <rect class="frame" x="14" y="14" width="132" height="72" rx="6" />
          <rect class="fill accent" x="24" y="24" width="30" height="14" rx="2" />
          <rect class="fill" x="60" y="24" width="30" height="14" rx="2" />
          <path class="arc" d="M112 58 a 18 18 0 1 1 18 18" />
          <path class="arc accent" d="M112 58 a 18 18 0 0 1 18 -18" />
          <path class="line accent" d="M24 74 L38 62 L50 68 L64 50 L78 58 L92 46" />
        }
        @case ('bars') {
          <path class="axis" d="M18 84 H142" />
          @for (h of [28, 44, 36, 58, 50, 66, 72]; track $index) {
            <rect class="bar" [class.accent]="$index === 6" [attr.x]="24 + $index * 17" [attr.y]="84 - h" width="11" [attr.height]="h" rx="2" />
          }
        }
        @case ('map') {
          <path class="frame" d="M14 22 L54 14 L106 24 L146 16 V80 L106 88 L54 78 L14 86 Z" />
          <path class="axis" d="M54 14 V78 M106 24 V88" />
          <path class="line accent dashed" d="M30 64 C 50 40, 76 70, 96 44 S 126 36, 132 30" />
          <circle class="node accent" cx="30" cy="64" r="4" />
          <circle class="node" cx="132" cy="30" r="4" />
        }
        @case ('gantt') {
          @for (b of gantt; track $index) {
            <rect class="bar" [class.accent]="$index === 2" [attr.x]="b[0]" [attr.y]="20 + $index * 16" [attr.width]="b[1]" height="10" rx="2" />
          }
          <path class="axis" d="M18 86 H142" />
        }
        @case ('container') {
          <rect class="frame" x="36" y="22" width="88" height="56" rx="6" />
          @for (r of [0, 1]; track r) {
            @for (c of [0, 1, 2, 3]; track c) {
              <rect class="fill" [class.accent]="r === 0 && c === 3" [attr.x]="46 + c * 18" [attr.y]="32 + r * 18" width="14" height="14" rx="2" />
            }
          }
          <path class="line" d="M18 88 C 40 80, 60 94, 80 86 S 120 80, 142 88" />
        }
        @case ('compass') {
          <circle class="frame" cx="80" cy="50" r="36" />
          @for (i of [0, 1, 2, 3, 4, 5, 6]; track i) {
            <circle class="node" [class.accent]="i === 0" [attr.cx]="80 + 36 * cos(i)" [attr.cy]="50 + 36 * sin(i)" r="4" />
          }
          <path class="needle accent" d="M80 50 L80 22" />
          <circle class="node accent" cx="80" cy="50" r="3" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      color: var(--text-soft);
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .edge, .frame, .axis, .arc, .line, .needle {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.4;
      stroke-linecap: round;
      opacity: 0.5;
    }
    .axis {
      opacity: 0.25;
    }
    .node, .fill, .bar {
      fill: var(--line-strong);
      stroke: currentColor;
      stroke-width: 1;
      stroke-opacity: 0.35;
    }
    .accent {
      stroke: var(--amber);
      opacity: 1;
    }
    .node.accent, .fill.accent, .bar.accent {
      fill: var(--amber);
    }
    .line.accent, .arc.accent, .needle {
      stroke-width: 2;
    }
    .dashed {
      stroke-dasharray: 4 5;
      animation: dash 3s linear infinite;
    }
    .packet {
      fill: var(--teal);
    }
    .needle {
      transform-origin: 80px 50px;
      animation: sweep 8s ease-in-out infinite;
    }
    .bar {
      transform-box: fill-box;
      transform-origin: bottom;
    }
    @keyframes dash {
      to {
        stroke-dashoffset: -36;
      }
    }
    @keyframes sweep {
      0%, 100% { transform: rotate(0deg); }
      30% { transform: rotate(160deg); }
      60% { transform: rotate(-80deg); }
    }
  `,
})
export class ArtifactGlyph {
  readonly kind = input.required<GlyphKind>();

  protected readonly gantt = [
    [18, 34],
    [48, 22],
    [66, 46],
    [104, 38],
  ];

  protected cos(i: number): number {
    return Math.cos((i / 7) * Math.PI * 2 - Math.PI / 2);
  }

  protected sin(i: number): number {
    return Math.sin((i / 7) * Math.PI * 2 - Math.PI / 2);
  }
}
