import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Cart } from "../cart/infrastructure/typeorm/cart.entity";
import { ProductOrmEntity } from "../products/infrastructure/persistence/typeorm/product.orm-entity";
import { Address } from "../address/address.entity";
import { Review } from "../review/review.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ default: false })
    emailVerified!: boolean;

    @Column({ nullable: true, select: false })
    emailVerificationCode?: string;

    @Column({ nullable: true, type: 'timestamp with time zone' })
    emailVerificationCodeExpiresAt?: Date;

    @Column({ nullable: true })
    phoneExtension?: string;

    @Column({ nullable: true })
    phoneNumber?: string;

    @Column({ nullable: true })
    profilePicture?: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    })
    profilePictureStatus!: string;

    @Column({
        type: 'enum',
        enum: ['superAdmin', 'admin', 'customer', 'provider', 'delivery'],
        default: 'customer'
    })
    role!: string;

    @OneToMany(() => Address, address => address.user)
    addresses?: Address[];

    @OneToMany(()=>Review, review=>review.user)
    reviews?: Review[];

    @Column({ select: false })
    password!: string;

    @OneToOne(() => Cart, cart => cart.user)
    cart?: Cart;

    @OneToMany(() => ProductOrmEntity, product => product.owner)
    products?: ProductOrmEntity[];
}
