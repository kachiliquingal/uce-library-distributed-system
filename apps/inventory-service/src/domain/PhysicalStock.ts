export class PhysicalStock {
  constructor(
    public isbn: string,
    public totalCopies: number,
    public availableCopies: number,
    public shelfLocation: string,
    public updatedAt: Date = new Date()
  ) {}

  addCopies(count: number) {
    if (count <= 0) throw new Error("Count must be greater than zero");
    this.totalCopies += count;
    this.availableCopies += count;
    this.updatedAt = new Date();
  }

  reduceCopies(count: number) {
    if (count <= 0) throw new Error("Count must be greater than zero");
    if (this.availableCopies < count) throw new Error("Not enough available copies to reduce");
    this.totalCopies -= count;
    this.availableCopies -= count;
    this.updatedAt = new Date();
  }

  updateShelfLocation(location: string) {
    this.shelfLocation = location;
    this.updatedAt = new Date();
  }
}
