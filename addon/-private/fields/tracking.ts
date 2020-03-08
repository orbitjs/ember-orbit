import { tracked as trackedFn } from '@glimmer/tracking';

type trackedWithPropertyDescriptor = (
  target: object,
  key: string,
  desc: PropertyDescriptor
) => PropertyDescriptor;

export const tracked = (trackedFn as any) as trackedWithPropertyDescriptor;
