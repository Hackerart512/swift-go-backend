// src/modules/users/dto/update-user.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// PartialType is a powerful utility from NestJS.
// It takes our CreateUserDto and creates a new class (UpdateUserDto)
// where every single property is now optional.
//
// This is perfect for our 'Edit Driver' form, as it allows the frontend
// to send only the fields that have actually changed.
export class UpdateUserDto extends PartialType(CreateUserDto) {}