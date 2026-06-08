// Type definitions for @lokta/mermaid.
export interface MermaidConfig {
  theme: string;
  themeVariables: Record<string, string>;
  flowchart?: Record<string, unknown>;
  sequence?: Record<string, unknown>;
  [k: string]: unknown;
}
export const loktaMermaidConfig: MermaidConfig;
export const loktaClassDefs: Record<string, string>;
export const loktaMermaidCSS: string;
export function injectLoktaMermaidCSS(): void;
export function initLoktaMermaid<T>(mermaid: T, overrides?: Partial<MermaidConfig>): T;
export default initLoktaMermaid;
