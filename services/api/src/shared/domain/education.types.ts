/**
 * Shared Education Types
 * 
 * Centralized education-related enums to avoid duplication across DTOs.
 * 
 * NOTE: Using UPPERCASE values as the canonical format.
 * If lowercase is needed (e.g., for legacy compatibility), use a mapper function.
 */

export enum EducationLevel {
  FUNDAMENTAL = 'FUNDAMENTAL',
  MEDIO = 'MEDIO',
  SUPERIOR = 'SUPERIOR',
  POS_GRADUACAO = 'POS_GRADUACAO',
}

/**
 * Mapper for legacy systems that expect lowercase values
 */
export const educationLevelToLowercase = (level: EducationLevel): string => {
  return level.toLowerCase();
};

/**
 * Mapper from lowercase to EducationLevel enum
 */
export const lowercaseToEducationLevel = (value: string): EducationLevel | null => {
  const upperValue = value.toUpperCase();
  if (Object.values(EducationLevel).includes(upperValue as EducationLevel)) {
    return upperValue as EducationLevel;
  }
  return null;
};
