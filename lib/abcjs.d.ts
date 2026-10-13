declare module "abcjs" {
  export interface AbcjsRenderOptions {
    responsive?: "resize" | "none";
    staffwidth?: number;
    paddingtop?: number;
    paddingbottom?: number;
    paddingleft?: number;
    paddingright?: number;
    add_classes?: boolean;
    selectionColor?: string;
    wrap?: {
      minSpacing?: number;
      maxSpacing?: number;
      preferredMeasuresPerLine?: number;
    };
  }

  export function renderAbc(
    target: string | HTMLElement,
    abc: string,
    options?: AbcjsRenderOptions,
  ): unknown;

  const abcjs: {
    renderAbc: typeof renderAbc;
  };

  export default abcjs;
}
