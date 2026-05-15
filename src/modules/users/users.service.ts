import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { hashpassword } from 'src/common/hashPassword';
import { PaginationResponseDto } from '../../common/dto/pagination-response-dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) { }

    async findAll(page = 1, limit = 10): Promise<PaginationResponseDto<User>> {
        const [users, total] = await this.userRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            data: users,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOneBy({ id });

        if (!user) {
            throw new NotFoundException('User Not Found');
        }

        return user;
    }

    findByEmail(email: string): Promise<User | null> {
        return this.userRepository.createQueryBuilder('user')
            .addSelect("user.password")
            .where('user.email= :email', { email })
            .getOne();
    }
    async createUser(dto: CreateUserDto): Promise<User> {
        const existingUser = await this.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await hashpassword(dto.password);
        const user = this.userRepository.create({
            ...dto,
            password: hashedPassword,
        });

        try {
            return await this.userRepository.save(user);
        } catch (error) {
            if (
                error instanceof QueryFailedError &&
                (error as any).code === '23505'
            ) {
                throw new ConflictException('Email already exists');
            }
            throw error;
        }
    }
    async updateUser(id: number, dto: UpdateUserDto): Promise<User | null> {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException('User Not Found')
        }
        Object.assign(user, dto)
        return this.userRepository.save(user);
    }
    async deleteUser(id: number): Promise<void> {
        await this.userRepository.delete(id);
    }
}
