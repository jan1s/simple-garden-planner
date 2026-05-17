/** Visual style for plan rendering (canvas vs export variants). */
export type PlanDrawStyle = 'garden' | 'architectural';

export function isArchitectural(style: PlanDrawStyle): boolean {
  return style === 'architectural';
}
