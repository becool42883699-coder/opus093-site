declare module "flubber" {
  type Ring = string | ReadonlyArray<readonly [number, number]>;
  interface InterpolateOptions {
    maxSegmentLength?: number;
    string?: boolean;
  }
  export function interpolate(from: Ring, to: Ring, options?: InterpolateOptions): (t: number) => string;
  export function toPathString(ring: ReadonlyArray<readonly [number, number]>): string;
  export function separate(from: Ring, toList: Ring[], options?: InterpolateOptions): (t: number) => string;
  export function combine(fromList: Ring[], to: Ring, options?: InterpolateOptions): (t: number) => string;
  export function interpolateAll(fromList: Ring[], toList: Ring[], options?: InterpolateOptions): Array<(t: number) => string>;
}
