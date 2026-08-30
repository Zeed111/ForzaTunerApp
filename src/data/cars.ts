import carJson from './cars.json';
import { VehicleInputs } from '../tuningEngine';

export interface PredefinedCar {
  id: string;
  name: string;
  brand: string;
  year: number;
  piClass: 'D' | 'C' | 'B' | 'A' | 'S1' | 'S2' | 'X' | string;
  specs: Omit<VehicleInputs, 'units' | 'discipline'>;
}

export const FORZA_CAR_DATABASE: PredefinedCar[] = carJson as PredefinedCar[];