export type ClothingGroup = "superior" | "inferior";
export type RackType = "superior" | "inferior" | "estante";
export type HangerType = "percha-hombro" | "percha-pinza" | "estante";

export type ClothingCategory = "camiseta" | "hoodie" | "jersey" | "pantalon" | "short";
export type AccessoryCategory = "gorra" | "gafas" | "cuello" | "guantes";

export type GarmentShape = "tee" | "hoodie" | "jersey" | "pants" | "shorts";
export type AccessoryShape = "cap" | "sunglasses" | "neckwarmer" | "gloves";

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface GarmentPrint {
  big?: string;
  small: string;
}

/**
 * Describes how to render a placeholder garment illustration — no external image files.
 * Stands in for the brief's displayImage/frontImage/backImage/galleryImages: each "view"
 * below is genuinely distinct artwork, never one image reused or rotated to fake another.
 */
export interface GarmentVisualSpec {
  kind: "garment";
  shape: GarmentShape;
  print: GarmentPrint;
  backPrint: GarmentPrint;
  trim: boolean;
}

/** Describes how to render a placeholder accessory illustration. */
export interface AccessoryVisualSpec {
  kind: "accessory";
  shape: AccessoryShape;
  mark: string;
}

export type VisualSpec = GarmentVisualSpec | AccessoryVisualSpec;

interface ProductBase {
  id: string;
  sku: string;
  name: string;
  subcategory: string;
  description: string;
  priceCOP: number;
  sizes: string[];
  colors: ColorOption[];
  stock: number;
  technicalFeatures: string[];
  gender?: "M" | "F";
}

export interface ClothingProduct extends ProductBase {
  type: "clothing";
  group: ClothingGroup;
  category: ClothingCategory;
  rackType: RackType;
  hangerType: HangerType;
  visual: GarmentVisualSpec;
}

export interface AccessoryProduct extends ProductBase {
  type: "accessory";
  category: AccessoryCategory;
  rackType: RackType;
  hangerType: HangerType;
  visual: AccessoryVisualSpec;
}

export type Product = ClothingProduct | AccessoryProduct;
