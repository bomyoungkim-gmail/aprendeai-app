export class ContextCard {
  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly title: string,
    public readonly message: string,
    public readonly ctaText: string,
    public readonly ctaUrl: string,
    public readonly color: string,
  ) {}
}
