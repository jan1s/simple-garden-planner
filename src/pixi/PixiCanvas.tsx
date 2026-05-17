import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import type { Point } from '../model/types';
import { SceneRenderer } from './SceneRenderer';
import { registerCanvasActions } from './canvasActions';
import { ToolController } from './interaction/ToolController';
import { useSceneStore } from '../store/sceneStore';

export function PixiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let app: Application;
    let viewport: Viewport;
    let renderer: SceneRenderer;
    let toolController: ToolController;
    let resizeObserver: ResizeObserver;

    const init = async () => {
      app = new Application();
      await app.init({
        background: '#e8ede8',
        resizeTo: container,
        antialias: true,
      });

      if (destroyed) {
        app.destroy(true);
        return;
      }

      container.appendChild(app.canvas);
      appRef.current = app;

      viewport = new Viewport({
        events: app.renderer.events,
        screenWidth: app.screen.width,
        screenHeight: app.screen.height,
        worldWidth: 20000,
        worldHeight: 20000,
      });

      app.stage.addChild(viewport);
      viewport
        .drag({ mouseButtons: 'right' })
        .pinch()
        .wheel({ smooth: 3 })
        .decelerate()
        .clampZoom({ minScale: 0.05, maxScale: 10 });

      viewport.moveCenter(0, 0);

      const syncViewportScale = () => {
        useSceneStore.getState().setViewportScale(viewport.scale.x);
      };
      viewport.on('zoomed', syncViewportScale);
      syncViewportScale();

      const getWorldPoint = (e: FederatedPointerEvent): Point =>
        viewport.toWorld(e.global) as Point;

      const requestRender = () => renderer?.render();

      toolController = new ToolController({
        viewport,
        getWorldPoint,
        getViewportScale: () => viewport.scale.x,
        requestRender,
      });
      toolController.mount(viewport);

      registerCanvasActions({
        finishDraft: () => toolController.finishDraft(),
      });

      renderer = new SceneRenderer(viewport, () => toolController);
      renderer.mount();
      renderer.render();

      resizeObserver = new ResizeObserver(() => {
        viewport.resize(app.screen.width, app.screen.height);
      });
      resizeObserver.observe(container);
    };

    init();

    return () => {
      destroyed = true;
      useSceneStore.getState().setViewportScale(1);
      registerCanvasActions(null);
      resizeObserver?.disconnect();
      toolController?.destroy();
      renderer?.destroy();
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  return <div className="canvas-container" ref={containerRef} />;
}
