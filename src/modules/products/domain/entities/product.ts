export class Product {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly price: number,
    public readonly userId?: number,
    public readonly image?: string,
    public readonly stock?: number,
    public readonly lowStockThreshold?: number,
  ) {}
}
