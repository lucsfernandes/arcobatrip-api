import { CreateDateColumn, DeleteDateColumn, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import 'reflect-metadata';

export class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Index({
    unique: true,
  })
  public id!: string;

  @UpdateDateColumn({
    nullable: false,
    name: 'updated_at',
    select: true
  })
  @Index()
  public updatedAt!: Date;

  @CreateDateColumn({
    nullable: false,
    name: 'created_at',
    select: true
  })
  @Index()
  public createdAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at'
  })
  public deletedAt?: Date;
}