import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('couple')
export class CoupleAuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() body: { name: string; password: string }) {
    return this.auth.loginCouple(body.name, body.password);
  }
}

