export const CarBrand = {
  BMW: "BMW",
  Mercedes: "Mercedes",
  Porsche: "Porsche",
  Audi: "Audi",
  Toyota: "Toyota",
  Honda: "Honda",
  Ford: "Ford",
  Tesla: "Tesla",
  Volkswagen: "Volkswagen",
} as const;

export type CarBrandType = (typeof CarBrand)[keyof typeof CarBrand];
