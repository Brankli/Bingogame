import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { mapToUserDto, UserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { User as UserDecorator } from '../decorators/user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    const user = await this.userService.create(createUserDto);
    return mapToUserDto(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<UserDto[]> {
    const users = await this.userService.findAll();
    return users.map(mapToUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<UserDto> {
    const user = await this.userService.findOne(id);
    if (user === null) {
      throw new NotFoundException();
    }

    return mapToUserDto(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.remove(+id);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @UserDecorator() user,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const isValid = await this.userService.validatePassword(
      user.id,
      body.currentPassword,
    );

    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.userService.changePassword(user.id, body.newPassword);
    return { success: true, message: 'Password changed successfully' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('adjust-earnings')
  async adjustEarnings(
    @UserDecorator() admin,
    @Body() body: { userId: number; amount: number; type: string; reason?: string },
  ) {
    const result = await this.userService.adjustEarnings(
      body.userId,
      body.amount,
      body.type as any,
      body.reason,
      admin.username,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id/earnings-history')
  async getEarningsHistory(@Param('id') id: string) {
    const history = await this.userService.getEarningsHistory(+id);
    return { data: history };
  }
}
