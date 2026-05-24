import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enum/role.enum';

// @Roles(Role.ADMIN, Role.SUPERADMIN)
@Controller('audit')
export class AuditController {
    constructor(
        private auditService : AuditService
    ){}


    @Get()
    getAllAudit(
        @Query('page', new ParseIntPipe()) page:number,
        @Query('limit', new ParseIntPipe()) limit:number){
        return this.auditService.getAllAudit(page,limit)
    }
}
