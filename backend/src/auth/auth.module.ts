import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Credential } from '../entities/credential.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Credential])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}


