export type FeatureFlagEnvironment = "DEV" | "STAGE" | "PROD";
export type FeatureFlagScopeType = "GLOBAL" | "INSTITUTION" | "USER";

export class FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  environment?: FeatureFlagEnvironment | null;
  scopeType?: FeatureFlagScopeType | null;
  scopeId?: string | null;
  createdBy: string;
  updatedAt: Date;
  createdAt: Date;

  constructor(partial: Partial<FeatureFlag>) {
    Object.assign(this, partial);
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }
}
