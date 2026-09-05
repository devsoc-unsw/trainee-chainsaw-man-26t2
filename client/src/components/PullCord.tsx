import { useEffect, useRef } from "react";
// courtesy of verlet integration inspired by https://codepen.io/rudtjd2548/pen/rNrxopK

const SEGMENTS = 14;
const GRAVITY = 0.5;
const DAMPING = 0.985;
const STIFFNESS = 6;
const ANCHOR = { x: 72, y: 0 };

const BREEZE_RADIUS = 140;
const BREEZE_FORCE = 0.7;

type Point = { x: number; y: number; px: number; py: number };

export function PullCord({
    open,
    onToggle,
    length,
    pointer,
}: {
    open: boolean;
    onToggle: () => void;
    length: number;
    pointer: { x: number; y: number } | null;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const lineRef = useRef<SVGPolylineElement>(null);
    const handleRef = useRef<SVGGElement>(null);

    const points = useRef<Point[]>([]);
    const pointerRef = useRef<{ x: number; y: number } | null>(null);
    pointerRef.current = pointer;
    const segLen = useRef(length / (SEGMENTS - 1));
    const targetSegLen = useRef(length / (SEGMENTS - 1));

    targetSegLen.current = length / (SEGMENTS - 1);

    if (points.current.length === 0) {
        points.current = Array.from({ length: SEGMENTS }, (_, i) => ({
            x: ANCHOR.x,
            y: ANCHOR.y + i * segLen.current,
            px: ANCHOR.x,
            py: ANCHOR.y + i * segLen.current,
        }));
    }

    useEffect(() => {
        let frame = 0;

        const tick = () => {
            const pts = points.current;
            segLen.current += (targetSegLen.current - segLen.current) * 0.06;
            const rest = segLen.current;
            const rect = svgRef.current?.getBoundingClientRect();
            const local =
                pointerRef.current && rect
                    ? {
                        x: pointerRef.current.x - rect.left,
                        y: pointerRef.current.y - rect.top,
                    }
                    : null;

            for (let i = 1; i < pts.length; i++) {
                const p = pts[i];
                const vx = (p.x - p.px) * DAMPING;
                const vy = (p.y - p.py) * DAMPING;
                p.px = p.x;
                p.py = p.y;
                p.x += vx;
                p.y += vy + GRAVITY;

                // The rope leans toward the cursor — nearer is stronger, and
                // lower segments swing more because they're less constrained.
                if (local) {
                    const dx = local.x - p.x;
                    const dy = local.y - p.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < BREEZE_RADIUS && dist > 0.01) {
                        const falloff = 1 - dist / BREEZE_RADIUS;
                        const depth = i / pts.length;
                        p.x += (dx / dist) * BREEZE_FORCE * falloff * depth;
                        p.y += (dy / dist) * BREEZE_FORCE * falloff * depth * 0.4;
                    }
                }
            }

            for (let pass = 0; pass < STIFFNESS; pass++) {
                pts[0].x = ANCHOR.x;
                pts[0].y = ANCHOR.y;

                for (let i = 0; i < pts.length - 1; i++) {
                    const a = pts[i];
                    const b = pts[i + 1];
                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const dist = Math.hypot(dx, dy) || 0.001;
                    const diff = (dist - rest) / dist / 2;
                    const ox = dx * diff;
                    const oy = dy * diff;

                    if (i !== 0) {
                        a.x += ox;
                        a.y += oy;
                    }
                    b.x -= ox;
                    b.y -= oy;
                }
            }

            const tail = pts[pts.length - 1];
            const prev = pts[pts.length - 2];
            const angle = (Math.atan2(tail.y - prev.y, tail.x - prev.x) * 180) / Math.PI - 90;

            lineRef.current?.setAttribute(
                "points",
                pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
            );
            handleRef.current?.setAttribute(
                "transform",
                `translate(${tail.x.toFixed(1)} ${tail.y.toFixed(1)}) rotate(${angle.toFixed(1)})`,
            );

            frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, []);

    const yank = () => {
        const tail = points.current[points.current.length - 1];
        tail.py = tail.y - 12;
    };

    return (
        <button
            type="button"
            onClick={() => {
                yank();
                onToggle();
            }}
            aria-expanded={open}
            aria-label={open ? "Close election menu" : "Open election menu"}
            className="block w-full cursor-pointer bg-transparent p-0 text-left"
        >
            <svg
                ref={svgRef}
                width="100%"
                height={length + 24}
                className="overflow-visible"
            >
                <polyline
                    ref={lineRef}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-on-dark/70"
                />
                <g ref={handleRef}>
                    <path
                        d="M 0 -2 L 8 12 L -8 12 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinejoin="round"
                        className="text-on-dark/70"
                    />
                </g>
            </svg>
        </button>
    );
}