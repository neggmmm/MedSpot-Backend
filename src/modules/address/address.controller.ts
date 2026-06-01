import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards} from '@nestjs/common';
import { AddressService } from './address.service';
import type { CreateAddressDto } from './dto/createAddress.dto';
import type { UpdateAddressDto } from './dto/updateAdress.dto';
import { AuthGuard } from '../auth/presentation/http/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('address')
export class AddressController {
    constructor(
        private readonly addressService: AddressService
    ) {}

    @Get()
    getMyAddresses(
        @Req() req
    ) {
        // Implement logic to retrieve the addresses of the currently authenticated user
        return this.addressService.getMyAddresses(req.user.sub);
    }

    @Get(':id')
    getAddressById(
        @Param('id') addressId: number,
        @Req() req
    ) {
        return this.addressService.getAddressById(addressId,req.user.sub);
    }
    @Post()
    createAddress(
        @Body() addressData: CreateAddressDto,
        @Req() req
    ) {
        return this.addressService.createAddress(req.user.sub, addressData);
    }

    @Patch(':id')
    updateAddress(
        @Param('id') addressId: number,
        @Body() addressData: UpdateAddressDto
    ) {
        // Implement logic to update the address with the given address ID using the provided address data
        return this.addressService.updateAddress(addressId, addressData);
    }

    @Delete(':id')
    deleteAddress(
        @Param('id') addressId: number,
        @Req() req
    ) {
        return this.addressService.deleteAddress(addressId, req.user.sub);
    }
}
