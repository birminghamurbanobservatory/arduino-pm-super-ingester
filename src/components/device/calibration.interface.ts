export interface Calibration {
  lt85: Constants;
  gte85: Constants;
}

interface Constants {
  m: number;
  c: number;
}