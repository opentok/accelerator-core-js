import { IAnnotation, IArchiving, IScreenSharing, ITextChat } from './accelerator-packs';
export declare class AcceleratorPackages {
    TextChat?: (options: unknown) => ITextChat;
    ScreenSharing?: (options: unknown) => IScreenSharing;
    Annotation?: (options: unknown) => IAnnotation;
    Archiving?: (options: unknown) => IArchiving;
    constructor(TextChat?: (options: unknown) => ITextChat, ScreenSharing?: (options: unknown) => IScreenSharing, Annotation?: (options: unknown) => IAnnotation, Archiving?: (options: unknown) => IArchiving);
}
