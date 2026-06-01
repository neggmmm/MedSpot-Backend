import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '../auth/presentation/http/guard/auth.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enum/role.enum';
import { OrderService } from './order.service';
import { OrderQueryDto } from './dto/order-query.dto';

@UseGuards(AuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderServices: OrderService) {}

  @Post('/create')
  create(@Req() req, @Body() body: { paymentMethod: string }) {
    return this.orderServices.createOrder(req.user.sub, body.paymentMethod);
  }

  // Admin: Get all orders with pagination
  @Get('/admin/orders')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseGuards(AuthorizationGuard)
  async getAllOrders(@Query() query: OrderQueryDto = new OrderQueryDto()) {
    // Limit max results per page to 50 for performance
    query.limit = Math.min(query.limit || 10, 50);

    const result = await this.orderServices.getAllOrders(query);

    // Calculate last page for response
    const lastPage = Math.ceil(result.total / query.limit);

    return {
      data: result.data,
      page: query.page || 1,
      limit: query.limit,
      total: result.total,
      lastPage,
    };
  }

  // User: Get my orders
  @Get()
  getMyOrders(@Req() req) {
    return this.orderServices.getMyOrders(req.user.sub);
  }

  @Get(':id')
  getOrder(@Req() req, @Param('id', ParseIntPipe) orderId: number) {
    return this.orderServices.getOrder(req.user.sub, orderId);
  }
}
