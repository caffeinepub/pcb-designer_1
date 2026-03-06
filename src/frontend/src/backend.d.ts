import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Rotation = bigint;
export interface Position {
    x: number;
    y: number;
}
export interface PCBDesign {
    name: string;
    createdAt: bigint;
    components: Array<Component>;
    updatedAt: bigint;
}
export interface UserProfile {
    name: string;
}
export interface Component {
    id: bigint;
    rotation: Rotation;
    name: string;
    position: Position;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteDesign(name: string): Promise<void>;
    getBoardstoreKeys(): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listDesigns(): Promise<Array<string>>;
    loadDesign(name: string): Promise<PCBDesign>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDesign(design: PCBDesign): Promise<void>;
}
