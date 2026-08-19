export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/; // E.164 format
export const VEHICLE_PLATE_REGEX = /^[A-Z0-9-]{2,10}$/i;

export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone);
};

export const isValidPlate = (plate: string): boolean => {
  return VEHICLE_PLATE_REGEX.test(plate);
};
