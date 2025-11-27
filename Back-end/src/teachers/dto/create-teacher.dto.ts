import { IsString, IsOptional, IsEmail, IsDateString } from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  teacherIdNumber: string;

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsDateString()
  hireDate: string;
}
