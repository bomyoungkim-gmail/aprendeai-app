export class Backlinks {
  constructor(
    public readonly nearDomain: string,
    public readonly farDomain: string,
  ) {
    if (!nearDomain || nearDomain.trim().length === 0) {
      throw new Error('Near domain cannot be empty');
    }
    if (!farDomain || farDomain.trim().length === 0) {
      throw new Error('Far domain cannot be empty');
    }
  }

  static create(nearDomain: string, farDomain: string): Backlinks {
    return new Backlinks(nearDomain, farDomain);
  }

  toJSON(): { nearDomain: string; farDomain: string } {
    return {
      nearDomain: this.nearDomain,
      farDomain: this.farDomain,
    };
  }

  static fromJSON(json: {
    nearDomain: string;
    farDomain: string;
  }): Backlinks {
    return new Backlinks(json.nearDomain, json.farDomain);
  }
}
