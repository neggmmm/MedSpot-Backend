import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/presentation/http/guard/auth.guard';
import { AuthorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { Role } from '../../common/enum/role.enum';
import { CreateProviderApplicationDto } from './dto/create-provider-application.dto';
import { ListProviderApplicationsQueryDto } from './dto/list-provider-applications-query.dto';
import { ProviderApplicationsService } from './provider-applications.service';
import { ReviewProviderApplicationDto } from './dto/review-provider-application.dto';

interface AuthenticatedRequest {
  user: {
    sub: number;
    role: string;
  };
}

@Controller('provider-applications')
@UseGuards(AuthGuard, AuthorizationGuard)
export class ProviderApplicationsController {
  constructor(private readonly providerApplicationsService: ProviderApplicationsService) {}

  @Post()
  createApplication(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProviderApplicationDto,
  ) {
    return this.providerApplicationsService.createApplication(req.user.sub, dto);
  }

  @Get('me')
  getMyApplications(@Req() req: AuthenticatedRequest) {
    return this.providerApplicationsService.getMyApplications(req.user.sub);
  }

  @Get('pending')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  getPendingApplications() {
    return this.providerApplicationsService.getPendingApplications();
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  getAllApplications(@Query() query: ListProviderApplicationsQueryDto) {
    return this.providerApplicationsService.getAllApplications(query);
  }

  @Patch(':id/review')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  reviewApplication(
    @Param('id') id: number,
    @Body() dto: ReviewProviderApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.providerApplicationsService.reviewApplication(id, dto, req.user.sub);
  }
}
