export class AnnotationOptions {
  constructor(
    public items: any,
    public colors: any,
    public onScreenCapture: Function,
    public absoluteParent: ParentOptions
  ) {}
}

export class ParentOptions {
  constructor(public publisher: string, public subscriber: string) {}
}
