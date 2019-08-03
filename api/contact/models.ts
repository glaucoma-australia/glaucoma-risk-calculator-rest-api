import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('contact_tbl')
export class Contact {
    public static _omit: string[] = [];

    @CreateDateColumn({ name: 'createdAt', precision: 3 })
    public createdAt!: Date;

    @UpdateDateColumn({ name: 'updatedAt', precision: 3 })
    public updatedAt!: Date;

    @PrimaryColumn({ type: 'varchar', name: 'email', nullable: false, primary: true, unique: true })
    public email!: string;

    @Column('varchar', { nullable: true })
    public name?: string;

    @Column('varchar', { nullable: false })
    public owner!: string;
}
