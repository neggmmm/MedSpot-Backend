import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CartItem } from '../../../../cart/infrastructure/typeorm/cartItem.entity';
import { User } from '../../../../users/users.entity';
import { CategoryOrmEntity } from '../../../../categories/infrastructure/persistence/typeorm/category.orm-entity';
import { Review } from 'src/modules/review/review.entity';
import { OrderItem } from '../../../../order/entity/orderItem.entity';

@Entity('products')
export class ProductOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ nullable: true })
  userId!: number;

  @Index()
  @Column({ nullable: true })
  categoryId?: number;

  // Nullable keeps the app compatible with products that existed before
  // ownership was introduced. New products still receive userId on creation.
  @ManyToOne(() => User, (user: User) => user.products, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  owner?: User;

  @ManyToOne(() => CategoryOrmEntity, (category) => category.products, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: CategoryOrmEntity;

  @Index()
  @Column()
  name!: string;

  @Index()
  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ type: 'int', default: 10 })
  lowStockThreshold!: number;

  @Column({ nullable: true })
  image?: string;

  @OneToMany(() => CartItem, (cartItem: CartItem) => cartItem.product)
  cartItems!: CartItem[];

  @OneToMany(() => Review, review => review.product)
  reviews?: Review[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems?: OrderItem[];
}
