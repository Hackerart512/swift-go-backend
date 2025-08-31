// src/modules/drivers/dto/driver-profile.dto.ts
import { Driver } from '../entities/driver.entity';

export class DriverProfileDto {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  status: string;
  kycStatus: string;
  profilePhotoUrl?: string;

  constructor(driver: Driver) {
    this.id = driver.id;
    this.fullName = driver.fullName;
    this.email = driver.email;
    this.mobileNumber = driver.mobileNumber;
    this.status = driver.status;
    this.kycStatus = driver.kycStatus;
    this.profilePhotoUrl = driver.profilePhotoUrl;
  }
}
