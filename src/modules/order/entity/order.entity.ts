import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderItem } from "./orderItem.entity";

export enum orderStatus{
    PENDING = "pending",
    ACCEPTED = "accepted",
    DELIVERING = "delivering",
    DELIVERED = "deliverd"
}

export enum orderMethods{
    COD = "Cash on delivery",
    ONLINE = "Online"
}
@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Index()
    @Column()
    userId: number;

    @Column({type:"enum", enum:orderMethods, default:orderMethods.COD})
    method:orderMethods;

    @Column({type:"enum",enum:orderStatus,default:orderStatus.PENDING})
    status: orderStatus;

    @Column()
    totalPrice: number;

    @Column({ nullable: true })
    paymobOrderId: string;

    @CreateDateColumn()
    createdAt: Date;
    
    @OneToMany(() => OrderItem, (item)=>item.order,{cascade:true, eager:true})
    items: OrderItem[]
}
