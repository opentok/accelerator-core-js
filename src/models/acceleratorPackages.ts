import {
  IAnnotation,
  IArchiving,
  IScreenSharing,
  ITextChat
} from './accelerator-packs';

export class AcceleratorPackages {
  constructor(
    public TextChat?: (options: unknown) => ITextChat,
    public ScreenSharing?: (options: unknown) => IScreenSharing,
    public Annotation?: (options: unknown) => IAnnotation,
    public Archiving?: (options: unknown) => IArchiving
  ) {}
}
