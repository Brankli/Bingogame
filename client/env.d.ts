/// <reference types="webpack-env" />

/* Vue 3 script-setup compiler macros (eslint + TS) */
declare const defineProps: <T>() => T;
declare const defineEmits: <T>() => T;
declare const defineExpose: (exposed?: Record<string, unknown>) => void;
declare const withDefaults: <T, D extends Partial<T>>(
  props: T,
  defaults: D,
) => T & D;
