"use client";
import { useEffect, useRef } from "react";

export default function Network3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", resize);

    // 3D Nodes
    const nodes: { x: number; y: number; z: number; vx: number; vy: number; vz: number }[] = [];
    const numNodes = 120;
    const maxDistance = 250;
    const fov = 400;

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 1200,
        z: (Math.random() - 0.5) * 1200,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: (Math.random() - 0.5) * 1.5,
      });
    }

    let animationFrameId: number;
    let angleY = 0;
    let angleX = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Slow rotation
      angleY += 0.001;
      angleX += 0.0005;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Update and project nodes
      const projectedNodes = nodes.map((node) => {
        // move node
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // boundary bounce (box of 1200x1200x1200)
        if (Math.abs(node.x) > 600) node.vx *= -1;
        if (Math.abs(node.y) > 600) node.vy *= -1;
        if (Math.abs(node.z) > 600) node.vz *= -1;

        // rotate Y
        const rx = node.x * cosY - node.z * sinY;
        const rz = node.z * cosY + node.x * sinY;

        // rotate X
        const ry = node.y * cosX - rz * sinX;
        let finalZ = rz * cosX + node.y * sinX;

        // translate Z so it's in front of camera
        finalZ += 800;

        const scale = fov / Math.max(1, finalZ);
        const x2d = rx * scale + width / 2;
        const y2d = ry * scale + height / 2;

        return { x: x2d, y: y2d, z: finalZ, scale };
      });

      // Draw lines
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const n1 = projectedNodes[i];
          const n2 = projectedNodes[j];
          
          // Don't draw if behind camera
          if (n1.z < 0 || n2.z < 0) continue;

          const d3x = nodes[i].x - nodes[j].x;
          const d3y = nodes[i].y - nodes[j].y;
          const d3z = nodes[i].z - nodes[j].z;
          const dist3d = Math.sqrt(d3x * d3x + d3y * d3y + d3z * d3z);

          if (dist3d < maxDistance) {
            const alpha = 1 - dist3d / maxDistance;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            // Gradient from Emerald to Indigo vibe based on nodes
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha * 0.4})`; 
            ctx.lineWidth = ((n1.scale + n2.scale) / 2) * 1.5;
            ctx.stroke();
          }
        }
      }

      // Draw points
      projectedNodes.forEach((node) => {
        if (node.z < 0) return;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.scale * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${Math.min(1, 600 / node.z)})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
        ctx.fill();
        ctx.shadowBlur = 0; // reset for next operations
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.55] mix-blend-screen z-0"
    />
  );
}
