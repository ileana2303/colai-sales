export interface IMaterialCategories {
  WC: string;
  CC: string;
  IC: string;
  OC: string;
  ABBOTT: string;
}

export interface IPlatformData {
  EOPPY: string;
  EKTO_EOPPY: string;
}

export interface IPatientFormData {
  amka: string;
  fullName: string;
  idNumber: string;
  phone: string;
  otp: string;
  email: string;
  dob: string;
  address: string;
  city: string;
  zip: string;
  deliverToOtherAddress: boolean;
  pickedUpByOther: boolean;
}

export type RecipientReason = "cant" | "other" | "";
export type RecipientRelation = "relative" | "friend" | "other" | "";

export interface IRecipientFormData {
  reason: RecipientReason;
  relation: RecipientRelation;
  fullName: string;
  idNumber: string;
  amka: string;
  afm: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
}

export interface IDoctorFormData {
  amka: string;
  fullName: string;
  afm: string;
  healthStructure: string;
  healthType: string;
  hasRefDoctor: boolean;
  refDoctorAmka: string;
  refDoctorFullName: string;
  refDoctorAfm: string;
}

export interface IEktosEoppyFormData {
  patient: IPatientFormData;
  recipient: IRecipientFormData;
  doctor: IDoctorFormData;
}
