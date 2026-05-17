type CanvasActions = {
  finishDraft: () => void;
};

let actions: CanvasActions | null = null;

export function registerCanvasActions(next: CanvasActions | null): void {
  actions = next;
}

export function finishCanvasDraft(): void {
  actions?.finishDraft();
}
