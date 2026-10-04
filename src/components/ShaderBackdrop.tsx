"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient WebGL backdrop: three blobs in the brand palette drifting slowly
 * over cream, masked out toward the fold (see .shader-backdrop in globals).
 *
 * Deliberately frugal — zero dependencies, one fullscreen triangle, renders
 * at half resolution and ~30fps, pauses when the tab is hidden, and bails
 * silently (leaving the static CSS gradient) on reduced-motion, missing
 * WebGL, or context loss.
 */

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform float uTime;
uniform vec2 uRes;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / max(uRes.y, 1.0);

  vec3 cream = vec3(1.000, 0.973, 0.945); // #fff8f1
  vec3 peach = vec3(1.000, 0.914, 0.839); // #ffe9d6 (primary-soft)
  vec3 blush = vec3(0.992, 0.933, 0.878); // #fdeee0 (cream-deep)
  vec3 mint  = vec3(0.843, 0.945, 0.922); // #d7f1eb (accent-soft)

  float t = uTime;
  vec2 c1 = vec2(0.22 + 0.10 * sin(t * 0.13), 0.72 + 0.08 * cos(t * 0.11));
  vec2 c2 = vec2(0.78 + 0.09 * cos(t * 0.09), 0.60 + 0.09 * sin(t * 0.12));
  vec2 c3 = vec2(0.50 + 0.14 * sin(t * 0.07 + 2.0), 0.32 + 0.07 * cos(t * 0.08 + 1.0));

  vec2 stretch = vec2(aspect, 1.0);
  vec2 d1 = (uv - c1) * stretch;
  vec2 d2 = (uv - c2) * stretch;
  vec2 d3 = (uv - c3) * stretch;

  vec3 col = cream;
  col = mix(col, blush, 0.90 * exp(-dot(d3, d3) * 7.0));
  col = mix(col, peach, 0.85 * exp(-dot(d1, d1) * 9.0));
  col = mix(col, mint, 0.50 * exp(-dot(d2, d2) * 12.0));

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ShaderBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vert = compile(gl, gl.VERTEX_SHADER, VERT);
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vert || !frag || !program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // One triangle that covers the viewport.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    const uRes = gl.getUniformLocation(program, "uRes");

    const RENDER_SCALE = 0.5; // soft gradients don't need pixels
    const resize = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth * RENDER_SCALE));
      const height = Math.max(1, Math.round(canvas.clientHeight * RENDER_SCALE));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let lastFrame = 0;
    let lost = false;
    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      if (lost || now - lastFrame < 32) return; // ~30fps is plenty
      lastFrame = now;
      gl.uniform1f(uTime, now / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !lost) raf = requestAnimationFrame(render);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="shader-backdrop" />;
}
