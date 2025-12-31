import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

export class CreateAccountDto{
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    name: string;

   @IsInt()
    @Min(1)
    @Max(7)
    account_class: number;
}