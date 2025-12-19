import { IsString, IsOptional, Length } from 'class-validator';

export class ApplyReferralCodeDto {
  @IsString()
  @Length(6, 20)
  code: string;
}

export class CreateReferralInviteDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsOptional()
  @Length(10, 20)
  phone?: string;
}
