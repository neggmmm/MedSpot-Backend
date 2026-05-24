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
