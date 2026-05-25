export interface UserDto {
  id: number;
  email: string;
  surname: string;
  firstname?: string;
  roles: string[];
}