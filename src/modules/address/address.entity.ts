import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../users/users.entity";

@Entity('address')

export class Address{
    @PrimaryGeneratedColumn()
    id!:number;

    @Column()
    street!:string;

    @Column()
    city!:string;

    @Column()
    building!:string;

    @Column()
    appartment!:string;

    @ManyToOne(() => User, user => user.addresses)
    @JoinColumn({ name: 'user_id' }) // optional: customize column name
    user!: User;

    @Column()
    userId!: number;
}