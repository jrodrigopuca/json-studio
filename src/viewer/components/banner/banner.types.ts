/**
 * Banner component types.
 */

/** Banner severity levels. */
export type BannerLevel = "info" | "warning" | "error";

/** Banner configuration. */
export interface BannerConfig {
	level: BannerLevel;
	message: string;
	dismissible: boolean;
}
