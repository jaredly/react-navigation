import * as React from 'react';
import type { ParamListBase, StackNavigationState } from '@react-navigation/native';
import type { NativeStackDescriptorMap, NativeStackNavigationHelpers } from '../types';
declare type RetainContextT = {
    retain(): string;
    release(key: string): boolean;
    restore(key: string): boolean;
    supported: boolean;
};
/**
 * This context allows you to retain screens in memory, even after
 * they have been popped off the stack. This is important for
 * supporting native iOS "Picture in Picture" mode, as the
 * originating UIViewController must be retained in memory for the
 * PiP overlay to continue running.
 * Retained screens can also be "restored" to the top of the stack,
 * for example when the user taps the button in the PiP overlay
 * to return to the app.
 */
export declare const RetainContext: React.Context<RetainContextT>;
export declare function useRetainContext(state: StackNavigationState<ParamListBase>, navigation: NativeStackNavigationHelpers, descriptors: NativeStackDescriptorMap): {
    retainContext: RetainContextT;
    hiddenRoutes: Route<any>[];
    hiddenDescriptors: NativeStackDescriptorMap;
    retainedKeys: string[];
};
export {};
//# sourceMappingURL=RetainContext.d.ts.map