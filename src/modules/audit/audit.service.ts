import { Injectable } from '@nestjs/common';
import { AuditLog } from './audit.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationResponseDto } from 'src/common/dto/pagination-response-dto';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private auditRepository : Repository<AuditLog>
    ) {}
    async create(data: Omit<AuditLog,"id"|"createdAt">): Promise<AuditLog>{
        const log = this.auditRepository.create(data);
        return this.auditRepository.save(log);
    }
    async getAllAudit(page=1,limit=10): Promise<PaginationResponseDto<AuditLog>>{
        limit = Math.min(limit, 100);
        const [data,total]= await this.auditRepository.findAndCount({
            skip: (page-1) * limit,
            take: limit
        })

        return {
            data,
            total,
            page,
            lastPage : Math.ceil(total/limit),
        }
    }
}
