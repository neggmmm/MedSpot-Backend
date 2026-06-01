import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderApplication } from './infrastructure/typeorm/provider-application.orm-entity';
import { User } from '../users/users.entity';
import { CreateProviderApplicationDto } from './dto/create-provider-application.dto';
import { ListProviderApplicationsQueryDto } from './dto/list-provider-applications-query.dto';
import { ReviewProviderApplicationDto } from './dto/review-provider-application.dto';
import { ProviderApplicationStatus } from './enums/provider-application-status.enum';
import { Role } from '../../common/enum/role.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProviderApplicationsService {
  constructor(
    @InjectRepository(ProviderApplication)
    private readonly applicationRepository: Repository<ProviderApplication>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService
  ) { }

  async createApplication(userId: number, dto: CreateProviderApplicationDto): Promise<ProviderApplication> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('Authenticated user not found');
    }

    if (user.role !== Role.CUSTOMER) {
      throw new ForbiddenException('Only customers can create provider applications');
    }

    const existingPending = await this.applicationRepository.findOne({
      where: {
        userId,
        status: ProviderApplicationStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new ConflictException('A pending application already exists for this user');
    }
    const application = this.applicationRepository.create({
      user,
      userId,
      businessName: dto.businessName,
      phoneNumber: dto.phoneNumber,
      notes: dto.notes,
      status: ProviderApplicationStatus.PENDING,
    });

    const savedApplication =
      await this.applicationRepository.save(application);

    await this.auditService.create({
      action: "Application created",

      performedBy: userId,

      entity: "ProviderApplication",

      entityId: savedApplication.id,
    });
    return savedApplication;
  }

  async getMyApplications(userId: number): Promise<ProviderApplication[]> {
    return this.applicationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllApplications(filters?: ListProviderApplicationsQueryDto): Promise<ProviderApplication[]> {
    const query = this.applicationRepository.createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.reviewedBy', 'reviewedBy')
      .orderBy('application.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('application.status = :status', { status: filters.status });
    }

    if (filters?.userId) {
      query.andWhere('application.userId = :userId', { userId: filters.userId });
    }

    return query.getMany();
  }

  async getPendingApplications(): Promise<ProviderApplication[]> {
    return this.applicationRepository.find({
      where: { status: ProviderApplicationStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async reviewApplication(
    applicationId: number,
    dto: ReviewProviderApplicationDto,
    adminId: number,
  ): Promise<ProviderApplication> {
    if (dto.status === ProviderApplicationStatus.PENDING) {
      throw new BadRequestException('Review status must be approved or rejected');
    }

    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['user'],
    });

    if (!application) {
      throw new NotFoundException('Provider application not found');
    }

    if (dto.status === ProviderApplicationStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting an application');
    }

    application.status = dto.status;
    application.rejectionReason = dto.status === ProviderApplicationStatus.REJECTED ? dto.rejectionReason : null;
    application.reviewedAt = new Date();
    application.reviewedById = adminId;

    if (dto.status === ProviderApplicationStatus.APPROVED) {
      application.user.role = Role.PROVIDER;
    }

    return this.applicationRepository.manager.transaction(async (manager) => {
      if (dto.status === ProviderApplicationStatus.APPROVED) {
        await manager.save(application.user);
      }

      return manager.save(application);
    });
  }
}
