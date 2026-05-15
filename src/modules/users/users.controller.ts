import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './users.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response-dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enum/role.enum';

@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) { }
    @Get()
   
    findAll(
        @Query('page', ParseIntPipe) page = 1,
        @Query('limit', ParseIntPipe) limit = 10
    ): Promise<PaginationResponseDto<User>> {
        return this.usersService.findAll(page, limit);
    }

    @Get('/search')
    searchUsers(
        @Query('q') query: string,
        @Query('page', ParseIntPipe) page = 1,
        @Query('limit', ParseIntPipe) limit = 10
    ): Promise<PaginationResponseDto<User>> {
        limit = Math.min(limit, 50);
        return this.usersService.searchUsers(query, page, limit);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
        return this.usersService.findOne(id)
    }
    @Post()
    createUser(@Body() dto: CreateUserDto): Promise<User> {
        return this.usersService.createUser(dto)
    }

    @Patch(':id')
    updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserDto): Promise<User | null> {
        return this.usersService.updateUser(id, dto)
    }
    @Delete(':id')
    deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.usersService.deleteUser(id)
    }
}
