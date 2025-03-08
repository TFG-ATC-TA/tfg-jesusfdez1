export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  description?: string;
}

export interface Farm {
  _id: string;
  name: string;
  idname: string;
}

export interface User {
  _id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  farms: string[];
}

export interface Device {
  _id: string;
  boardId: string;
  type: string;
  farm: string;
  equipment: string;
  description: string;
  sensors: {
    sensorId: string;
    name: string;
  }[];
}

export interface MilkCollection {
  _id: string;
  collectionDate: Date;
  cisternLicensePlate: string;
  collectionCompany: string;
  driver: string;
  tankId: string;
  sampleLabel: string;
  milkTemperature: number;
  inhibitorSampleTaken: boolean;
  litersPerTank: {
    tankId: string;
    liters: number;
    compartment: string;
  }[];
}