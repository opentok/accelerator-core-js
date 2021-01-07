import { LinkCanvasOptions } from './linkCanvasOptions';

export interface IAnnotation {
  new (options: unknown): void;
  start(session: OT.Session, options?: unknown): Promise<void>;
  linkCanvas(
    pubSub: OT.Publisher | OT.Subscriber,
    annotationContainer: HTMLElement,
    options: LinkCanvasOptions
  ): void;
  addSubscriberToExternalWindow(stream: OT.Stream): void;
  end(): void;
}
