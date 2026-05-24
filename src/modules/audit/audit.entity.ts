import {
 Entity,
 PrimaryGeneratedColumn,
 Column,
 CreateDateColumn
} from "typeorm";

@Entity("audit_logs")
export class AuditLog {

 @PrimaryGeneratedColumn()
 id!: number;

 @Column()
 action!: string;

 @Column()
 entity!: string;

 @Column()
 entityId!: number;

 @Column()
 performedBy!: number;

 @Column({
   type: "json",
   nullable: true
 })
 metadata?: Record<string, unknown>;

 @CreateDateColumn()
 createdAt!: Date;
}