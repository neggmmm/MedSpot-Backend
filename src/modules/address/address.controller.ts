import { Body, Controller, Delete, Get, Param, Patch, Post} from '@nestjs/common';
import { AddressService } from './address.service';
import type { CreateAddressDto } from './dto/createAddress.dto';
import type { UpdateAddressDto } from './dto/updateAdress.dto';

@Controller('address')
export class AddressController {
    constructor(
        private readonly addressService: AddressService
    ) {}

    @Get()
    getMyAddresses(
        @Param('userId') userId: number
    ) {
        // Implement logic to retrieve the addresses of the currently authenticated user
        return this.addressService.getMyAddresses(userId);
    }
    @Post()
    createAddress(
        @Body() addressData: CreateAddressDto,
        @Param('userId') userId: number
    ) {
        // Implement logic to create a new address for the currently authenticated user
        return this.addressService.createAddress(userId, addressData);
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
        @Param('userId') userId: number
    ) {
        // Implement logic to delete the address with the given address ID
        return this.addressService.deleteAddress(addressId, userId);
    }
}
