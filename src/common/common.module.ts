import { Global, Module } from '@nestjs/common';
import { AuthorizationGuard } from './guards/authorization.guard';
import { PermissionsService } from './permissions.service';

@Global() // Makes providers available globally
@Module({
  providers: [
    AuthorizationGuard,
    PermissionsService,
  ],
  exports: [
    AuthorizationGuard,
    PermissionsService,
  ],
})
export class CommonModule {}