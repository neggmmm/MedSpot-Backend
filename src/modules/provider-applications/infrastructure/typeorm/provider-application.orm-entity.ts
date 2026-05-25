import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ProviderApplicationStatus } from '../../enums/provider-application-status.enum';
import { User } from '../../../users/users.entity';

@Entity('provider_applications')
export class ProviderApplication {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  businessName!: string;

  @Column()
  phoneNumber!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'enum', enum: ProviderApplicationStatus, default: ProviderApplicationStatus.PENDING })
  status!: ProviderApplicationStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ nullable: true })
  reviewedById?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewedBy?: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
