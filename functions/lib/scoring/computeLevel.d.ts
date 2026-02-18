import { Level } from '../types';
export interface ComputeLevelInput {
    totalScore: number;
}
export declare function computeLevel(input: ComputeLevelInput): Level;
