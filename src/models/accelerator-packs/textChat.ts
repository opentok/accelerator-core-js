export interface ITextChat {
  isDisplayed(): boolean;
  isEnabled(): boolean;
  showTextChat(): void;
  hideTextChat(): void;
  deliverUnsentMessage(): void;
}
