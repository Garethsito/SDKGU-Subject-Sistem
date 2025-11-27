import { IsOptional, IsString } from 'class-validator';

export class CreateTeacherDto {
  @IsOptional()
  @IsString()
  teacherIdNumber?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
