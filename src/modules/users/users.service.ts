import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { hashpassword } from 'src/common/hashPassword';
import { PaginationResponseDto } from '../../common/dto/pagination-response-dto';
import { S3UserFileStorageService } from './infrastructure/storage/s3-user-file-storage.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
        ,
        private readonly userFileStorage: S3UserFileStorageService,
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

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.createQueryBuilder('user')
            .addSelect("user.password")
            .where('user.email= :email', { email })
            .getOne();
    }

    async searchUsers(query: string, page = 1, limit = 10): Promise<PaginationResponseDto<User>> {
        const qb = this.userRepository.createQueryBuilder('user')
            .where('user.email ILIKE :query', { query: `%${query}%` })
            .orWhere('user.name ILIKE :query', { query: `%${query}%` })
            .skip((page - 1) * limit)
            .take(limit);

        const [users, total] = await qb.getManyAndCount();

        return {
            data: users,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
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

    async updateEmailVerificationCode(userId: number, code: string, expiresAt: Date): Promise<User> {
        const user = await this.findOne(userId);
        user.emailVerificationCode = code;
        user.emailVerificationCodeExpiresAt = expiresAt;
        return this.userRepository.save(user);
    }

    async verifyEmailCode(email: string, code: string): Promise<User> {
        const user = await this.userRepository.createQueryBuilder('user')
            .addSelect('user.emailVerificationCode')
            .addSelect('user.emailVerificationCodeExpiresAt')
            .where('user.email = :email', { email })
            .getOne();

        if (!user || !user.emailVerificationCode || user.emailVerificationCode !== code) {
            throw new BadRequestException('Invalid verification code');
        }

        if (!user.emailVerificationCodeExpiresAt || user.emailVerificationCodeExpiresAt < new Date()) {
            throw new BadRequestException('Verification code has expired');
        }

        user.emailVerified = true;
        user.emailVerificationCode = undefined;
        user.emailVerificationCodeExpiresAt = undefined;
        return this.userRepository.save(user);
    }

    async updateUser(
        id: number,
        dto: UpdateUserDto,
        currentUser: { sub: number; role: string },
    ): Promise<User> {
        const user = await this.findOne(id);

        if (!this.canUpdateUser(id, currentUser)) {
            throw new ForbiddenException('You may only update your own account unless you are an admin');
        }

        if (dto.password) {
            dto.password = await hashpassword(dto.password);
        }

        if (!['admin', 'superAdmin'].includes(currentUser.role) && currentUser.sub !== id) {
            delete dto.role;
            delete dto.profilePictureStatus;
        }

        Object.assign(user, dto);
        return this.userRepository.save(user);
    }

    async uploadUserProfilePicture(
        id: number,
        file: Express.Multer.File,
        currentUser: { sub: number; role: string },
    ): Promise<User> {
        if (!this.canUpdateUser(id, currentUser)) {
            throw new ForbiddenException('You may only upload a profile picture for your own account unless you are an admin');
        }

        const user = await this.findOne(id);
        user.profilePicture = await this.userFileStorage.save(file) ?? user.profilePicture;
        user.profilePictureStatus = 'pending';
        return this.userRepository.save(user);
    }

    async reviewUserProfilePicture(
        id: number,
        approved: boolean,
        currentUser: { sub: number; role: string },
    ): Promise<User> {
        if (!['admin', 'superAdmin'].includes(currentUser.role)) {
            throw new ForbiddenException('Only admins can review profile pictures');
        }

        const user = await this.findOne(id);
        user.profilePictureStatus = approved ? 'approved' : 'rejected';
        return this.userRepository.save(user);
    }

    private canUpdateUser(id: number, currentUser: { sub: number; role: string }): boolean {
        return ['admin', 'superAdmin'].includes(currentUser.role) || currentUser.sub === id;
    }
    async deleteUser(id: number): Promise<void> {
        await this.userRepository.delete(id);
    }
}
