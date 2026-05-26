import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './address.entity';
import { Repository } from 'typeorm';
import { UpdateAddressDto } from './dto/updateAdress.dto';
import { CreateAddressDto } from './dto/createAddress.dto';

@Injectable()
export class AddressService {

    constructor(
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>
    ) {}

    async getMyAddresses(userId: number) {
        return this.addressRepository.find({ where: { userId }})
    }

    async createAddress(userId: number, addressData: CreateAddressDto) {
        const existingCount = await this.addressRepository.count({
            where: { userId }
        });

        if (existingCount >= 5) {
            throw new BadRequestException(
                'Maximum of 5 addresses allowed per user'
            );
        }

        const address = this.addressRepository.create({
            ...addressData,
            userId,
        });

        return this.addressRepository.save(address);
    }

    async updateAddress(addressId: number, addressData: UpdateAddressDto) {
        // Implement logic to update the address with the given address ID using the provided address data
        const address = await this.addressRepository.findOne({ where: { id: addressId } });
        if (!address) {
            throw new BadRequestException('Address not found');
        }
        Object.assign(address, addressData);
        return this.addressRepository.save(address);
    }

    async deleteAddress(addressId: number,userId: number) {
        // Implement logic to delete the address with the given address ID
        const result = await this.addressRepository.delete({
            id: addressId,
            userId,
        });

        if (result.affected === 0) throw new NotFoundException('Address not found');
        return { message: 'Address deleted successfully' };
    }

}
