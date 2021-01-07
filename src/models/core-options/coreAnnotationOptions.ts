export class CoreAnnotationOptions {
  constructor(
    public items: unknown,
    public colors: unknown,
    public onScreenCapture: unknown,
    public absoluteParent: ParentOptions
  ) {}
}

export class ParentOptions {
  constructor(public publisher: string, public subscriber: string) {}
}
