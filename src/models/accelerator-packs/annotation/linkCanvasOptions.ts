export class LinkCanvasOptions {
  /**
   * @param absoluteParent Reference to element(or query selector) for resize if other than container
   * @param canvasContainer The id of the parent for the annotation canvas
   * @param externalWindow Reference to the annotation window(or query selector) if publishing
   * @param mobileInitiator Is cobrowsing being initiated by a mobile device
   */
  constructor(
    public absoluteParent?: string | HTMLElement,
    public canvasContainer?: string,
    public externalWindow?: string | HTMLElement,
    public mobileInitiator?: boolean
  ) {}
}
