export function createCardId(setCode: string, collectorNumber: number): string {
  return `${setCode}${collectorNumber.toString().padStart(3, '0')}`;
}
